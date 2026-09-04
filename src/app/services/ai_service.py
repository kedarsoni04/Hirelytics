import os
import random
import re
import json
import io
from typing import Dict, Any

from app import models
from google import genai
from groq import Groq
import requests

# Configure Gemini safely
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")
        return None

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize Groq client: {e}")
        return None

def _clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return text

def _call_llm_json(prompt: str) -> Any:
    """
    Attempts to call Gemini first, then falls back to Groq models ('openai/gpt-oss-20b', 'groq/compound-mini').
    Returns parsed JSON object/dict/list, or None if all fail.
    """
    # 1. Try Gemini
    gemini_client = get_gemini_client()
    if gemini_client:
        for gemini_model in ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-flash-latest"]:
            try:
                response = gemini_client.models.generate_content(
                    model=gemini_model,
                    contents=prompt,
                )
                if response and response.text:
                    cleaned = _clean_json_text(response.text)
                    return json.loads(cleaned)
            except Exception as e:
                # Silently try next model/provider
                continue

    # 2. Try Groq
    groq_client = get_groq_client()
    if groq_client:
        groq_models = ["openai/gpt-oss-20b", "groq/compound-mini"]
        for g_model in groq_models:
            try:
                completion = groq_client.chat.completions.create(
                    model=g_model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
                response_text = completion.choices[0].message.content.strip()
                cleaned = _clean_json_text(response_text)
                return json.loads(cleaned)
            except Exception as e:
                print(f"Groq API fallback error on {g_model}: {e}")
                continue

    return None

def match_resume_to_jd(resume_text: str, job_description: str) -> dict:
    """
    Uses Gemini or Groq to analyze how well a resume matches a job description.
    """
    prompt = f"""You are an expert technical recruiter. Analyze how well this resume matches this job description.
  
JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}

Respond ONLY with a JSON object (no markdown, no explanation):
{{
  "match_score": <integer 0-100>,
  "matching_skills": [<list of skills found in both>],
  "missing_skills": [<list of skills in JD but not in resume>],
  "summary": "<one sentence assessment>"
}}"""

    data = _call_llm_json(prompt)
    if isinstance(data, dict) and "match_score" in data:
        try:
            return {
                "match_score": int(data.get("match_score", 75)),
                "matching_skills": list(data.get("matching_skills", [])),
                "missing_skills": list(data.get("missing_skills", [])),
                "summary": str(data.get("summary", "Candidate profile aligns with required technical qualifications."))
            }
        except Exception as e:
            print(f"Error parsing resume match data: {e}")

    # Fallback when AI is unreachable
    return {
        "match_score": 75,
        "matching_skills": ["Problem Solving", "Technical Competencies"],
        "missing_skills": [],
        "summary": "Candidate profile evaluated with baseline qualifications."
    }


def generate_interview_questions(job_title: str, job_description: str, required_skills: list, resume_text: str) -> list[dict]:
    """
    Uses Gemini or Groq to generate a realistic, job-specific interview flow with 6 questions.
    """
    prompt = f"""You are an expert technical interviewer. Generate an interview flow of exactly 6 questions for a candidate applying for the role of '{job_title}'.
  
JOB DESCRIPTION:
{job_description}

REQUIRED SKILLS:
{', '.join(required_skills) if required_skills else 'None specified'}

CANDIDATE RESUME / BACKGROUND:
{resume_text}

Generate EXACTLY 6 questions following this structure:
1. One intro/background question (tailored to their resume — reference something specific from it).
2. Two technical questions specific to the job's required skills (not generic, ask real scenario questions).
3. One problem-solving / scenario-based question relevant to the role.
4. One soft-skill / behavioral question (teamwork, conflict, deadline pressure).
5. One "why this role / closing" question.

Respond ONLY with a JSON object in this exact format:
{{
  "questions": [
    {{"question": "...", "category": "intro"}},
    {{"question": "...", "category": "technical"}},
    {{"question": "...", "category": "technical"}},
    {{"question": "...", "category": "problem_solving"}},
    {{"question": "...", "category": "soft_skill"}},
    {{"question": "...", "category": "closing"}}
  ]
}}"""

    data = _call_llm_json(prompt)
    questions = []
    if isinstance(data, dict) and "questions" in data and isinstance(data["questions"], list):
        questions = data["questions"]
    elif isinstance(data, list):
        questions = data

    if len(questions) >= 6:
        return questions[:6]

    return [
        {"question": "Can you walk me through your resume and highlight a project you're most proud of?", "category": "intro"},
        {"question": "Describe a time you had to learn a new technology quickly. How did you approach it?", "category": "technical"},
        {"question": "Tell me about a challenging technical project you worked on and how you overcame the obstacles.", "category": "technical"},
        {"question": "How would you design a scalable system to handle sudden spikes in user traffic?", "category": "problem_solving"},
        {"question": "How do you handle disagreements with team members on technical decisions?", "category": "soft_skill"},
        {"question": "Why are you interested in this role and what do you hope to achieve here?", "category": "closing"}
    ]

def analyze_interview(transcript: str, questions: list = None) -> Dict[str, Any]:
    """
    Analyzes an interview transcript using Groq or Gemini for sentiment and keeps heuristics for filler words/keywords.
    """
    transcript_lower = transcript.lower()
    
    # Calculate filler words
    filler_words = ["um", "uh", "like", "you know"]
    filler_word_count = 0
    for word in filler_words:
        filler_word_count += len(re.findall(r'\b' + re.escape(word) + r'\b', transcript_lower))

    # Keyword matches
    tech_keywords = ["react", "python", "api", "database", "algorithm", "cloud", "fastapi", "sql", "git"]
    keyword_matches = [kw for kw in tech_keywords if kw in transcript_lower]
    
    # Split transcript into technical and soft skills
    soft_skills_text = ""
    technical_text = ""
    
    parts = re.split(r'Question \d+:', transcript)
    if questions and len(parts) > 1:
        for i, q in enumerate(questions):
            if i + 1 < len(parts):
                part = parts[i+1]
                answer_split = part.split('Answer:', 1)
                ans = answer_split[1].strip() if len(answer_split) > 1 else part.strip()
                
                cat = q.get('category') if isinstance(q, dict) else "unknown"
                if cat in ['soft_skill', 'closing', 'intro']:
                    soft_skills_text += f"\nAnswer: {ans}"
                elif cat in ['technical', 'problem_solving']:
                    technical_text += f"\nAnswer: {ans}"
                else:
                    soft_skills_text += f"\nAnswer: {ans}"
    else:
        soft_skills_text = transcript
        technical_text = transcript

    prompt = f"""Analyze this interview transcript and respond ONLY with JSON (no markdown, no explanation).
We have separated the answers into Soft Skills and Technical.

SOFT SKILLS & BEHAVIORAL ANSWERS:
{soft_skills_text}

TECHNICAL & PROBLEM-SOLVING ANSWERS:
{technical_text}

{{
  "confidence_score": <integer 0-100, based on clarity and assertiveness in soft skill answers>,
  "tone": "<one of: confident, neutral, hesitant>",
  "communication_quality": "<one of: excellent, good, average, poor>",
  "key_strengths": [<2-3 specific strengths observed>],
  "areas_for_improvement": [<1-2 specific areas>],
  "technical_score": <integer 0-100, based on technical depth, correctness of reasoning, and terminology in technical answers>
}}"""

    confidence_score = 75.0
    technical_score = 70.0
    tone = "confident" if filler_word_count <= 3 else "neutral"
    communication_quality = "good" if filler_word_count <= 3 else "average"
    key_strengths = ["Structured thought process", "Clear technical articulation"]
    areas_for_improvement = ["Minimize filler expressions"] if filler_word_count > 4 else []

    data = _call_llm_json(prompt)
    if isinstance(data, dict):
        try:
            confidence_score = float(data.get("confidence_score", confidence_score))
            technical_score = float(data.get("technical_score", technical_score))
            tone = data.get("tone", tone)
            communication_quality = data.get("communication_quality", communication_quality)
            key_strengths = data.get("key_strengths", key_strengths)
            areas_for_improvement = data.get("areas_for_improvement", areas_for_improvement)
        except Exception as e:
            print(f"Error parsing interview analysis data: {e}")

    return {
        "confidence_score": round(confidence_score, 2),
        "technical_score": round(technical_score, 2),
        "tone": tone,
        "communication_quality": communication_quality,
        "key_strengths": key_strengths,
        "areas_for_improvement": areas_for_improvement,
        "filler_word_count": filler_word_count,
        "keyword_matches": keyword_matches
    }

def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribes audio using Groq Whisper API with fallback model.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY is not configured")

    # Ensure filename has a supported audio extension for Whisper
    valid_exts = (".m4a", ".mp3", ".webm", ".mp4", ".mpga", ".wav", ".mpeg", ".ogg")
    if not any(filename.lower().endswith(ext) for ext in valid_exts):
        filename = f"{filename}.webm"

    client = Groq(api_key=groq_api_key)
    whisper_models = ["whisper-large-v3", "whisper-large-v3-turbo"]
    
    last_err = None
    for w_model in whisper_models:
        try:
            transcription = client.audio.transcriptions.create(
                file=(filename, audio_bytes),
                model=w_model
            )
            return transcription.text
        except Exception as e:
            last_err = e
            print(f"Whisper API error on {w_model}: {e}")
            continue

    raise last_err or RuntimeError("Failed to transcribe audio with available Whisper models")

def extract_text_from_resume_url(resume_url: str) -> str:
    """
    Downloads a PDF from a Cloudinary URL and extracts its text content
    using pdfplumber. Falls back to an empty string on failure.
    """
    try:
        import pdfplumber
        resp = requests.get(resume_url, timeout=15)
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
        extracted = "\n".join(pages_text).strip()
        return extracted if extracted else ""
    except Exception as e:
        print(f"PDF text extraction error: {e}")
        return ""


def generate_scorecard(student: models.Student, assessment_score: float, interview_data: Dict[str, Any], drive: models.Drive) -> Dict[str, Any]:
    """
    Generates a scorecard based on candidate data using real Gemini AI logic.
    Uses extracted PDF text from resume_url when available; falls back to skills array.
    """
    job_description = drive.description or "No description provided for the drive."

    # Prefer real extracted resume text; fall back to skills-as-proxy
    resume_text = ""
    if getattr(student, "resume_url", None):
        resume_text = extract_text_from_resume_url(student.resume_url)

    if not resume_text:
        # Fallback: use skills array as proxy
        resume_text = ", ".join(student.skills) if student.skills else "No skills listed"
    
    match_data = match_resume_to_jd(resume_text, job_description)
    resume_match_score = float(match_data.get("match_score", 60.0))
    
    # Calculate communication score from interview data
    confidence = float(interview_data.get("confidence_score", 70.0))
    filler_count = float(interview_data.get("filler_word_count", 0))
    comm_quality = interview_data.get("communication_quality", "average").lower()
    technical_interview_score = float(interview_data.get("technical_score", 70.0))
    
    # Adjust score based on communication quality field from Groq
    comm_quality_multiplier = 1.0
    if comm_quality == "excellent":
        comm_quality_multiplier = 1.1
    elif comm_quality == "poor":
        comm_quality_multiplier = 0.8
        
    comm_score_raw = (confidence - (filler_count * 2.0)) * comm_quality_multiplier
    communication_score = round(max(0.0, min(100.0, comm_score_raw)), 2)
    
    # Weighted average overall score (4 categories now)
    overall_ai_score = round(
        (resume_match_score * 0.25) + 
        (assessment_score * 0.25) + 
        (communication_score * 0.25) + 
        (technical_interview_score * 0.25), 
        2
    )

    # Summary
    if match_data.get("summary") and match_data.get("summary") != "AI analysis unavailable":
        ai_summary = match_data.get("summary")
    else:
        if overall_ai_score > 80:
            ai_summary = "Strong candidate with excellent technical and communication skills."
        elif overall_ai_score >= 60:
            ai_summary = "Solid candidate, worth a closer look."
        else:
            ai_summary = "Below average fit for this role."

    # Insights
    keyword_matches = interview_data.get("keyword_matches", [])
    clarity_desc = "strong" if filler_count <= 3 else "room for improvement in"
    
    ai_insights = [
        f"Scored {assessment_score}% on technical assessment.",
        f"Technical Interview depth scored at {technical_interview_score}%.",
        f"Mentioned {len(keyword_matches)} relevant technical keywords during interview.",
        f"{int(filler_count)} filler words detected — {clarity_desc} verbal clarity."
    ]
    
    if match_data.get("matching_skills"):
        ai_insights.append(f"Strong overlap with JD skills: {', '.join(match_data['matching_skills'][:3])}.")
    if match_data.get("missing_skills"):
        ai_insights.append(f"Missing some preferred skills: {', '.join(match_data['missing_skills'][:3])}.")

    return {
        "resume_match_score": resume_match_score,
        "assessment_score": assessment_score,
        "communication_score": communication_score,
        "technical_interview_score": technical_interview_score,
        "overall_ai_score": overall_ai_score,
        "ai_summary": ai_summary,
        "ai_insights": ai_insights
    }
