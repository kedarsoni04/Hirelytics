import os
import cloudinary
import cloudinary.uploader

# Initialize Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


def upload_resume(file_bytes: bytes, filename: str, student_id: str) -> str:
    """
    Uploads a PDF resume to Cloudinary under hirelytics/resumes/{student_id}/.
    Uses resource_type="raw" which is required for non-image files like PDFs.
    Returns the secure_url of the uploaded file.
    """
    # Clean base name (alphanumeric, hyphens, underscores) and ensure .pdf extension
    import re
    raw_base = os.path.splitext(filename)[0]
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', raw_base).strip('_') or "resume"
    public_id = f"hirelytics/resumes/{student_id}/{clean_name}.pdf"

    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        resource_type="raw",
        overwrite=True,         # Replace existing resume if student re-uploads
        invalidate=True,        # Bust the CDN cache on overwrite
    )
    return result["secure_url"]


def delete_resume(public_id: str) -> bool:
    """
    Deletes a previously uploaded resume from Cloudinary.
    Used for cleanup when a student uploads a replacement.
    Returns True on success, False on failure.
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="raw")
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        return False


def upload_offer_letter(file_bytes: bytes, application_id: str) -> str:
    """
    Uploads a generated Offer Letter PDF to Cloudinary under hirelytics/offers/{application_id}.pdf
    Falls back to writing to public/offer_letters/ if Cloudinary is unavailable.
    Returns the URL/path to the offer letter.
    """
    try:
        if os.getenv("CLOUDINARY_CLOUD_NAME") and os.getenv("CLOUDINARY_API_KEY"):
            public_id = f"hirelytics/offers/{application_id}"
            result = cloudinary.uploader.upload(
                file_bytes,
                public_id=public_id,
                resource_type="raw",
                overwrite=True,
                invalidate=True,
            )
            raw_url: str = result["secure_url"]
            # Insert fl_attachment so Cloudinary adds Content-Disposition: attachment
            # and the browser downloads it as a PDF rather than failing to open raw bytes.
            # For raw resources the URL looks like:
            #   https://res.cloudinary.com/<cloud>/raw/upload/<public_id>
            # We inject the transformation before the version/public_id segment.
            if "/raw/upload/" in raw_url:
                pdf_url = raw_url.replace(
                    "/raw/upload/",
                    "/raw/upload/fl_attachment:Offer_Letter/"
                )
            else:
                pdf_url = raw_url
            return pdf_url
    except Exception as e:
        print(f"[Storage] Cloudinary offer letter upload failed: {e}. Storing locally.")

    # Local fallback
    try:
        local_dir = os.path.join(os.getcwd(), "public", "offer_letters")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, f"{application_id}.pdf")
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return f"/offer_letters/{application_id}.pdf"
    except Exception as e:
        print(f"[Storage] Local offer letter store failed: {e}")
        return ""

