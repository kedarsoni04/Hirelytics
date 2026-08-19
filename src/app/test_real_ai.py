import os
import json
from dotenv import load_dotenv
load_dotenv()

from app.services.ai_service import match_resume_to_jd, analyze_interview

def main():
    print("Testing match_resume_to_jd (Gemini)...")
    try:
        resume = "React, Node.js, Python, PostgreSQL, Docker, AWS"
        jd = "Looking for a backend engineer with Python and PostgreSQL experience. Bonus points for Docker."
        res = match_resume_to_jd(resume, jd)
        print("Gemini response:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Gemini failed: {e}")

    print("\nTesting analyze_interview (Groq)...")
    try:
        transcript = "Um, I think my biggest strength is, like, building fast APIs using Python and FastAPI. I also, you know, optimize the database queries."
        res = analyze_interview(transcript)
        print("Groq response:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Groq failed: {e}")

if __name__ == "__main__":
    main()
