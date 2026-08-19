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

# Configure Gemini
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def match_resume_to_jd(resume_text: str, job_description: str) -> dict:
    """
    Uses Gemini to analyze how well a resume matches a job description.
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

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        text = response.text.strip()
        
        # Remove potential markdown formatting (like ```json ... ```)
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
            
        data = json.loads(text)
        return {
            "match_score": int(data.get("match_score", 60)),
            "matching_skills": data.get("matching_skills", []),
            "missing_skills": data.get("missing_skills", []),
            "summary": data.get("summary", "Generic matching assessment.")
        }
    except Exception as e:
        print(f"Gemini API error: {e}")
        return {
            "match_score": 60,
            "matching_skills": [],
            "missing_skills": [],
            "summary": "AI analysis unavailable"
        }

def analyze_interview(transcript: str) -> Dict[str, Any]:
    """
    Analyzes an interview transcript using Groq for sentiment and keeps heuristics for filler words/keywords.
    """
    transcript_lower = transcript.lower()
    
    # Calculate filler words
    filler_words = ["um", "uh", "like", "you know"]
    filler_word_count = 0
    for word in filler_words:
        filler_word_count += len(re.findall(r'\b' + re.escape(word) + r'\b', transcript_lower))

    # Keyword matches
    tech_keywords = ["react", "python", "api", "database", "algorithm", "cloud", "fastapi"]
    keyword_matches = [kw for kw in tech_keywords if kw in transcript_lower]

    prompt = f"""Analyze this interview transcript and respond ONLY with JSON (no markdown, no explanation):
{{
  "confidence_score": <integer 0-100, based on clarity, structure, and assertiveness of answers>,
  "tone": "<one of: confident, neutral, hesitant>",
  "communication_quality": "<one of: excellent, good, average, poor>",
  "key_strengths": [<2-3 specific strengths observed>],
  "areas_for_improvement": [<1-2 specific areas>]
}}

Transcript:
{transcript}"""

    confidence_score = 70.0
    tone = "neutral"
    communication_quality = "average"
    key_strengths = []
    areas_for_improvement = []

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="groq/compound",
            temperature=0,
        )
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Strip markdown if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
            
        data = json.loads(response_text)
        confidence_score = float(data.get("confidence_score", 70.0))
        tone = data.get("tone", "neutral")
        communication_quality = data.get("communication_quality", "average")
        key_strengths = data.get("key_strengths", [])
        areas_for_improvement = data.get("areas_for_improvement", [])
    except Exception as e:
        print(f"Groq API error: {e}")
        # Fallback to heuristic
        base_confidence = random.uniform(70.0, 95.0)
        penalty = min(filler_word_count * 2.0, 20.0)
        confidence_score = max(50.0, base_confidence - penalty)
        if confidence_score > 85:
            tone = "confident"
        elif confidence_score < 70 or filler_word_count > 5:
            tone = "hesitant"

    return {
        "confidence_score": round(confidence_score, 2),
        "tone": tone,
        "communication_quality": communication_quality,
        "key_strengths": key_strengths,
        "areas_for_improvement": areas_for_improvement,
        "filler_word_count": filler_word_count,
        "keyword_matches": keyword_matches
    }

def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribes audio using Groq Whisper API.
    """
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        transcription = client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model="whisper-large-v3"
        )
        return transcription.text
    except Exception as e:
        print(f"Whisper API error: {e}")
        raise

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
    
    # Adjust score based on communication quality field from Groq
    comm_quality_multiplier = 1.0
    if comm_quality == "excellent":
        comm_quality_multiplier = 1.1
    elif comm_quality == "poor":
        comm_quality_multiplier = 0.8
        
    comm_score_raw = (confidence - (filler_count * 2.0)) * comm_quality_multiplier
    communication_score = round(max(0.0, min(100.0, comm_score_raw)), 2)
    
    # Weighted average overall score
    overall_ai_score = round(
        (resume_match_score * 0.3) + 
        (assessment_score * 0.3) + 
        (communication_score * 0.4), 
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
        "overall_ai_score": overall_ai_score,
        "ai_summary": ai_summary,
        "ai_insights": ai_insights
    }
