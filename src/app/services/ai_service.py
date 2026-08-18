import random
import re
from typing import Dict, Any

from app import models

def analyze_interview(transcript: str) -> Dict[str, Any]:
    """
    PLACEHOLDER AI LOGIC: Analyzes an interview transcript.
    To be replaced with a real Gemini/Groq call later.
    """
    transcript_lower = transcript.lower()
    
    # Calculate filler words
    filler_words = ["um", "uh", "like", "you know"]
    filler_word_count = 0
    for word in filler_words:
        # Simple count using regex for whole word match
        filler_word_count += len(re.findall(r'\b' + re.escape(word) + r'\b', transcript_lower))

    # Keyword matches
    tech_keywords = ["react", "python", "api", "database", "algorithm", "cloud", "fastapi"]
    keyword_matches = [kw for kw in tech_keywords if kw in transcript_lower]

    # Mock confidence score based on transcript length and filler words
    base_confidence = random.uniform(70.0, 95.0)
    penalty = min(filler_word_count * 2.0, 20.0)
    confidence_score = max(50.0, base_confidence - penalty)
    
    # Simple heuristic for tone
    tone = "neutral"
    if confidence_score > 85:
        tone = "confident"
    elif confidence_score < 70 or filler_word_count > 5:
        tone = "hesitant"

    return {
        "confidence_score": round(confidence_score, 2),
        "tone": tone,
        "filler_word_count": filler_word_count,
        "keyword_matches": keyword_matches
    }

def generate_scorecard(student: models.Student, assessment_score: float, interview_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    PLACEHOLDER AI LOGIC: Generates a scorecard based on candidate data.
    To be replaced with a real Gemini/Groq call later.
    """
    # Mock resume match score
    resume_match_score = round(random.uniform(60.0, 95.0), 2)
    
    # Calculate communication score from interview data
    confidence = float(interview_data.get("confidence_score", 70.0))
    filler_count = float(interview_data.get("filler_word_count", 0))
    comm_score_raw = confidence - (filler_count * 2.0)
    communication_score = round(max(0.0, min(100.0, comm_score_raw)), 2)
    
    # Weighted average overall score
    overall_ai_score = round(
        (resume_match_score * 0.3) + 
        (assessment_score * 0.3) + 
        (communication_score * 0.4), 
        2
    )

    # Template-generated summary
    if overall_ai_score > 80:
        ai_summary = "Strong candidate with excellent technical and communication skills."
    elif overall_ai_score >= 60:
        ai_summary = "Solid candidate, worth a closer look."
    else:
        ai_summary = "Below average fit for this role."

    # Template insights
    keyword_matches = interview_data.get("keyword_matches", [])
    clarity_desc = "strong" if filler_count <= 3 else "room for improvement in"
    
    ai_insights = [
        f"Scored {assessment_score}% on technical assessment.",
        f"Mentioned {len(keyword_matches)} relevant technical keywords during interview.",
        f"{int(filler_count)} filler words detected — {clarity_desc} verbal clarity."
    ]

    return {
        "resume_match_score": resume_match_score,
        "assessment_score": assessment_score,
        "communication_score": communication_score,
        "overall_ai_score": overall_ai_score,
        "ai_summary": ai_summary,
        "ai_insights": ai_insights
    }
