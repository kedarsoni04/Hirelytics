import os
import json
from dotenv import load_dotenv
load_dotenv()

from app.services.ai_service import match_resume_to_jd, analyze_interview, generate_interview_questions

def main():
    print("Testing match_resume_to_jd (AI with fallback)...")
    try:
        resume = "React, Node.js, Python, PostgreSQL, Docker, AWS"
        jd = "Looking for a backend engineer with Python and PostgreSQL experience. Bonus points for Docker."
        res = match_resume_to_jd(resume, jd)
        print("Match response:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Match failed: {e}")

    print("\nTesting generate_interview_questions (AI with fallback)...")
    try:
        res = generate_interview_questions(
            job_title="Full Stack Engineer",
            job_description="Develop web apps using Next.js, FastAPI, PostgreSQL",
            required_skills=["Next.js", "FastAPI", "PostgreSQL"],
            resume_text="Experienced in React, Next.js, Node.js, Python FastAPI and database tuning."
        )
        print("Generated Questions:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Question generation failed: {e}")

    print("\nTesting analyze_interview (Groq with fallback)...")
    try:
        transcript = "Um, I think my biggest strength is, like, building fast APIs using Python and FastAPI. I also, you know, optimize the database queries."
        res = analyze_interview(transcript)
        print("Interview analysis response:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Analysis failed: {e}")

if __name__ == "__main__":
    main()
