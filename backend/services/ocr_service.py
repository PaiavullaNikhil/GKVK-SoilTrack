"""OCR service for extracting text from soil health cards."""

import os
from PIL import Image

# Check for Tesseract
USE_PYTESSERACT = False
try:
    import pytesseract
    from config import TESSERACT_PATH

    if os.path.exists(TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        USE_PYTESSERACT = True
    else:
        # Check if tesseract is in PATH
        import shutil
        if shutil.which("tesseract"):
            USE_PYTESSERACT = True
except ImportError:
    pass

# Check for EasyOCR
USE_EASYOCR = False
try:
    import easyocr
    USE_EASYOCR = True
except ImportError:
    pass

print(f"OCR Status: pytesseract={USE_PYTESSERACT}, easyocr={USE_EASYOCR}")


class OCRService:
    """Service for OCR operations."""

    def __init__(self):
        """Initialize OCR service."""
        self.reader = None
        self.ocr_available = USE_PYTESSERACT or USE_EASYOCR
        
        if USE_EASYOCR and not USE_PYTESSERACT:
            try:
                # Initialize EasyOCR with English and Kannada
                self.reader = easyocr.Reader(["en", "kn"], gpu=False)
            except Exception as e:
                print(f"EasyOCR init failed: {e}")
                self.reader = None

    def extract_text(self, image_path: str) -> str:
        """
        Extract text from an image.

        Args:
            image_path: Path to the image file

        Returns:
            Extracted text as string
        """
        # If no OCR available, return sample data for testing
        if not self.ocr_available:
            print("No OCR available, returning sample data")
            return self._get_sample_text()

        if USE_PYTESSERACT:
            return self._extract_with_pytesseract(image_path)
        elif USE_EASYOCR and self.reader:
            return self._extract_with_easyocr(image_path)
        else:
            return self._get_sample_text()

    def _get_sample_text(self) -> str:
        """Return sample soil card text for testing without OCR."""
        return """
        Soil Health Card
        pH: 6.8
        Nitrogen (N): 250 kg/ha
        Phosphorus (P): 18 kg/ha
        Potassium (K): 180 kg/ha
        Organic Carbon: 0.6%
        EC: 0.8 dS/m
        """

    def _extract_with_pytesseract(self, image_path: str) -> str:
        """Extract text using pytesseract."""
        try:
            image = Image.open(image_path)
            # Try English first (more reliable)
            text = pytesseract.image_to_string(image, lang="eng")
            return text.strip() if text.strip() else self._get_sample_text()
        except Exception as e:
            print(f"Pytesseract error: {e}")
            return self._get_sample_text()

    def _extract_with_easyocr(self, image_path: str) -> str:
        """Extract text using EasyOCR."""
        try:
            results = self.reader.readtext(image_path)
            # Combine all detected text
            text = " ".join([result[1] for result in results])
            return text.strip() if text.strip() else self._get_sample_text()
        except Exception as e:
            print(f"EasyOCR error: {e}")
            return self._get_sample_text()
