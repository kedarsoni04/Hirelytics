import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_offer_letter_pdf(
    candidate_name: str,
    candidate_email: str,
    company_name: str,
    job_title: str,
    package: str,
    location: str,
    college: str = "",
    branch: str = "",
    cgpa: float | None = None,
    offer_date: str = "",
) -> bytes:
    """
    Generates a professional corporate Offer Letter PDF in memory.
    Returns the generated PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#4F46E5")
    dark_color = colors.HexColor("#1E293B")
    muted_color = colors.HexColor("#64748B")

    company_title_style = ParagraphStyle(
        "CompanyTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=0,
    )

    doc_type_style = ParagraphStyle(
        "DocType",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=muted_color,
        alignment=0,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=dark_color,
    )

    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=15,
        textColor=dark_color,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=colors.white,
    )

    story = []

    # 1. Header / Letterhead
    header_data = [
        [
            Paragraph(f"<b>{company_name.upper()}</b>", company_title_style),
            Paragraph("<b>OFFICIAL EMPLOYMENT OFFER</b>", doc_type_style),
        ],
        [
            Paragraph("Campus Talent Acquisition & Placement Division", body_style),
            Paragraph(f"Date: {offer_date or datetime.now(timezone.utc).strftime('%B %d, %Y')}", body_style),
        ],
    ]
    header_table = Table(header_data, colWidths=[330, 190])
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(header_table)

    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

    # 2. Candidate Salutation
    story.append(Paragraph(f"<b>Dear {candidate_name},</b>", body_bold))
    story.append(Spacer(1, 8))

    intro_text = (
        f"Following your impressive performance during the campus recruitment process and comprehensive evaluations, "
        f"<b>{company_name}</b> is pleased to extend this formal offer of employment for the position of "
        f"<b>{job_title}</b>. We believe your technical skills, leadership capabilities, and dedication will make a "
        f"significant contribution to our organization."
    )
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 14))

    # 3. Employment Details Table
    details = [
        [Paragraph("Offer Parameter", table_header_style), Paragraph("Details", table_header_style)],
        [Paragraph("Candidate Name", body_bold), Paragraph(candidate_name, body_style)],
        [Paragraph("Candidate Email", body_bold), Paragraph(candidate_email, body_style)],
    ]
    if college:
        details.append([Paragraph("Institution / College", body_bold), Paragraph(college, body_style)])
    if branch:
        details.append([Paragraph("Academic Branch", body_bold), Paragraph(branch, body_style)])
    if cgpa is not None:
        details.append([Paragraph("Cumulative GPA (CGPA)", body_bold), Paragraph(f"{cgpa:.2f} / 10.00", body_style)])

    details.extend([
        [Paragraph("Designation / Role", body_bold), Paragraph(job_title, body_style)],
        [Paragraph("Annual Package (CTC)", body_bold), Paragraph(f"<b>{package or 'As per company policy'}</b>", body_style)],
        [Paragraph("Work Location", body_bold), Paragraph(location or "To be allocated at onboarding", body_style)],
        [Paragraph("Employment Type", body_bold), Paragraph("Full-Time Permanent", body_style)],
    ])

    details_table = Table(details, colWidths=[180, 340])
    details_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
        ])
    )
    story.append(details_table)
    story.append(Spacer(1, 15))

    # 4. Terms and conditions
    terms_title = Paragraph("<b>Terms & Conditions:</b>", body_bold)
    story.append(terms_title)
    story.append(Spacer(1, 6))

    terms_text = (
        "1. This offer is contingent upon successful verification of your academic credentials and background references.<br/>"
        "2. The compensation structure will follow the standard payroll policies and statutory deductions applicable.<br/>"
        "3. Specific reporting date, induction guidelines, and documentation requirements will be shared by Human Resources."
    )
    story.append(Paragraph(terms_text, body_style))
    story.append(Spacer(1, 14))

    closing_text = (
        "We welcome you aboard and look forward to an exciting and rewarding journey together. "
        "Congratulations on your selection!"
    )
    story.append(Paragraph(closing_text, body_style))
    story.append(Spacer(1, 24))

    # 5. Signatures
    sig_data = [
        [
            Paragraph("<b>Authorized Signatory</b><br/>Human Resources & Talent Acquisition<br/>" + company_name, body_style),
            Paragraph("<b>Candidate Acceptance</b><br/>Digitally Accepted & Confirmed<br/>" + candidate_name, body_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEABOVE", (0, 0), (0, 0), 1, primary_color),
            ("LINEABOVE", (1, 0), (1, 0), 1, colors.HexColor("#10B981")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(sig_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
