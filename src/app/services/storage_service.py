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
    # Strip extension from filename to use as public_id base
    base_name = os.path.splitext(filename)[0]
    public_id = f"hirelytics/resumes/{student_id}/{base_name}"

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
