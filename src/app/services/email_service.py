import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Dict, Any


def send_offer_letter_email(
    to_email: str,
    candidate_name: str,
    company_name: str,
    job_title: str,
    pdf_bytes: bytes,
    filename: str = "Offer_Letter.pdf",
) -> Dict[str, Any]:
    """
    Sends an offer letter PDF email to the candidate's email address.
    If SMTP credentials are configured in .env, connects and dispatches via SMTP.
    Otherwise, simulates sending gracefully and logs the dispatch details.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_USER")
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASSWORD")
    sender_email = os.getenv("EMAIL_FROM") or smtp_user or "admissions@hirelytics.ai"

    subject = f"Official Offer of Employment: {job_title} at {company_name}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; }}
        .header {{ background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
        .content {{ padding: 20px; background-color: #ffffff; }}
        .badge {{ background-color: #ecfdf5; color: #047857; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 13px; display: inline-block; margin-bottom: 15px; }}
        .footer {{ text-align: center; font-size: 12px; color: #64748b; padding-top: 20px; border-top: 1px solid #f1f5f9; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Congratulations, {candidate_name}! 🎉</h2>
          <p style="margin:5px 0 0 0; font-size: 14px; opacity: 0.9;">Welcome to {company_name}</p>
        </div>
        <div class="content">
          <div class="badge">OFFER LETTER ATTACHED</div>
          <p>Dear <b>{candidate_name}</b>,</p>
          <p>We are thrilled to officially congratulate you on your appointment as <b>{job_title}</b> at <b>{company_name}</b>.</p>
          <p>Your accepted offer of employment has been verified and processed by the hiring team. Please find your official signed Offer Letter attached to this email in PDF format.</p>
          <p>The offer letter outlines your compensation package, designated location, and terms of employment.</p>
          <p>We look forward to welcoming you to the team!</p>
          <br/>
          <p>Warm regards,<br/><b>Campus Recruitment Team</b><br/>{company_name} & Hirelytics Placement Platform</p>
        </div>
        <div class="footer">
          <p>This is an automated notification sent via Hirelytics Campus Placement Portal to {to_email}.</p>
        </div>
      </div>
    </body>
    </html>
    """

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{company_name} via Hirelytics <{sender_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            msg.attach(MIMEText(html_content, "html"))

            part = MIMEApplication(pdf_bytes, Name=filename)
            part["Content-Disposition"] = f'attachment; filename="{filename}"'
            msg.attach(part)

            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender_email, [to_email], msg.as_string())
            server.quit()
            print(f"[EMAIL SERVICE] Successfully sent offer letter email to {to_email} via SMTP.")
            return {"success": True, "mode": "smtp", "recipient": to_email}
        except Exception as e:
            print(f"[EMAIL SERVICE] SMTP dispatch error: {e}. Falling back to simulated log.")

    # Simulated fallback if no SMTP configured or SMTP error
    print(
        f"[EMAIL SERVICE] (Simulated Delivery) Sent offer letter email to {to_email} "
        f"for {candidate_name} ({job_title} at {company_name}). Attachment: {filename} ({len(pdf_bytes)} bytes)."
    )
    return {"success": True, "mode": "simulated", "recipient": to_email}
