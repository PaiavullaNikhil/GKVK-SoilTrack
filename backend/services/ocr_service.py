"""OCR service using Google Cloud Vision DOCUMENT_TEXT_DETECTION."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from google.api_core.exceptions import GoogleAPICallError, RetryError
from google.cloud import vision

logger = logging.getLogger(__name__)


@dataclass
class OCRWord:
    text: str
    confidence: float
    bbox: List[Tuple[int, int]]  # list of (x, y)


@dataclass
class OCRLine:
    text: str
    confidence: float
    words: List[OCRWord]


@dataclass
class OCRPage:
    page_number: int
    width: int
    height: int
    lines: List[OCRLine]


@dataclass
class OCRStructuredResult:
    full_text: str
    pages: List[OCRPage]
    key_values: Dict[str, str]
    # Legacy-style row grouping (words clustered by y/x like old EasyOCR code)
    rows: List[str] = field(default_factory=list)


class OCRService:
    """Extract soil data using Google Cloud Vision API."""

    def __init__(self) -> None:
        # Kannada is "kn" in Vision language hints
        self.language_hints = ["en", "kn"]
        self._client = vision.ImageAnnotatorClient()
        # More variants improve low-quality OCR but cost extra API calls.
        self.max_ocr_passes = 3
        logger.info("OCRService (Google Cloud Vision) initialized.")

    # -----------------------------
    # Public API
    # -----------------------------

    def extract_text(self, image_input: Union[str, bytes, np.ndarray]) -> str:
        """Backward-compatible API used by the rest of the backend.

        Returns a newline-separated string of 'row' texts,
        similar to the previous EasyOCR implementation.
        """
        structured = self.extract_text_structured(image_input)

        # Prefer row grouping built from bounding boxes (closest to old EasyOCR behavior)
        if structured.rows:
            rows = structured.rows
        else:
            rows = []
            for page in structured.pages:
                for line in page.lines:
                    if line.text.strip():
                        rows.append(line.text.strip())

        full_text = "\n".join(rows)

        # Apply same domain-specific corrections as before
        corrections = {
            "05-1.0": "0.5-1.0",
            "05-0.75": "0.5-0.75",
            "5.05.5": "5.0-5.5",
            ";5.05.5": "5.0-5.5",
            "5y0,6": ">0.6",
            "5y0.6": ">0.6",
            "?4.5": ">4.5",
            "?0.2": ">0.2",
            ">0:2": ">0.2",
            ">1:0": ">1.0",
            "ZR": "Zn",
        }
        for wrong, correct in corrections.items():
            full_text = full_text.replace(wrong, correct)

        has_kannada = any(0x0C80 <= ord(c) <= 0x0CFF for c in full_text)
        print(f"Kannada text detected: {has_kannada}", flush=True)

        print(f"\n=== OCR EXTRACTED {len(rows)} ROWS ===", flush=True)
        for i, row in enumerate(rows[:15]):
            try:
                print(f"  Row {i+1}: {row}", flush=True)
            except Exception:
                print(f"  Row {i+1}: [Kannada text]", flush=True)
        print("=== END OCR ===\n", flush=True)

        return full_text

    def extract_text_structured(
        self, image_input: Union[str, bytes, np.ndarray]
    ) -> OCRStructuredResult:
        """Full structured OCR output for advanced use cases.

        Returns full text, pages/lines/words with bounding boxes,
        and simple key-value extraction.
        """
        print(f"Processing image (type: {type(image_input).__name__})", flush=True)

        try:
            base_img = self._load_image(image_input)
            candidates = self._build_preprocess_variants(base_img)[: self.max_ocr_passes]
        except Exception as e:
            logger.exception("OCR preprocessing failed.")
            raise RuntimeError(f"OCR preprocessing failed: {e}") from e

        best_structured: Optional[OCRStructuredResult] = None
        best_score = -1.0
        last_api_error: Optional[Exception] = None

        for variant_name, candidate_bytes in candidates:
            try:
                response = self._run_document_text_detection(candidate_bytes)
                structured = self._parse_response(response)
                score = self._score_structured_result(structured)
                logger.info("OCR variant '%s' score=%.2f", variant_name, score)
                if score > best_score:
                    best_score = score
                    best_structured = structured
            except RuntimeError as e:
                last_api_error = e
                logger.warning("OCR variant '%s' failed: %s", variant_name, e)
                continue

        if best_structured is None:
            if last_api_error:
                raise last_api_error
            raise RuntimeError("OCR failed for all preprocessing variants.")

        structured = best_structured
        structured.key_values = self._extract_key_values(structured.full_text)
        return structured

    # -----------------------------
    # Preprocessing
    # -----------------------------

    def _load_image(self, image_input: Union[str, bytes, np.ndarray]) -> np.ndarray:
        """Load image input into BGR numpy array."""
        if isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_input, str):
            img = cv2.imread(image_input, cv2.IMREAD_COLOR)
        else:
            img = image_input

        if img is None:
            raise ValueError("Failed to load image for OCR.")
        return img

    def _build_preprocess_variants(
        self, img_bgr: np.ndarray
    ) -> List[Tuple[str, bytes]]:
        """Create multiple image variants for robust OCR on low-quality scans."""
        variants: List[Tuple[str, bytes]] = []

        # 1) Original color image (sometimes preserves faint Kannada glyphs best)
        variants.append(("original", self._encode_png_bytes(img_bgr)))

        # Light upscaling for tiny/low-resolution images
        h, w = img_bgr.shape[:2]
        working = img_bgr
        if max(h, w) < 1400:
            working = cv2.resize(
                img_bgr, None, fx=1.8, fy=1.8, interpolation=cv2.INTER_CUBIC
            )

        gray = cv2.cvtColor(working, cv2.COLOR_BGR2GRAY)

        # Strong denoise path (for noisy captures)
        denoised = cv2.fastNlMeansDenoising(gray, h=12.0)
        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # Variant 2: adaptive threshold + morphology (good for uneven lighting)
        adaptive = cv2.adaptiveThreshold(
            enhanced,
            maxValue=255,
            adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            thresholdType=cv2.THRESH_BINARY,
            blockSize=35,
            C=9,
        )
        adaptive = cv2.medianBlur(adaptive, 3)
        adaptive = cv2.morphologyEx(
            adaptive, cv2.MORPH_CLOSE, np.ones((2, 2), dtype=np.uint8)
        )
        variants.append(("adaptive_threshold", self._encode_png_bytes(adaptive)))

        # Variant 3: bilateral + OTSU + sharpen (good for blur/low contrast)
        smooth = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
        smooth = clahe.apply(smooth)
        _, otsu = cv2.threshold(smooth, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel = np.array(
            [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32
        )
        otsu = cv2.filter2D(otsu, -1, kernel)
        variants.append(("otsu_sharpen", self._encode_png_bytes(otsu)))

        return variants

    def _encode_png_bytes(self, img: np.ndarray) -> bytes:
        success, encoded = cv2.imencode(".png", img)
        if not success:
            raise RuntimeError("Failed to encode image to PNG.")
        return encoded.tobytes()

    def _run_document_text_detection(self, image_bytes: bytes) -> Any:
        """Run DOCUMENT_TEXT_DETECTION with language hints and API error handling."""
        try:
            image = vision.Image(content=image_bytes)
            image_context = vision.ImageContext(language_hints=self.language_hints)
            response = self._client.document_text_detection(
                image=image,
                image_context=image_context,
            )
        except (GoogleAPICallError, RetryError) as e:
            logger.exception("Vision API call failed.")
            raise RuntimeError(f"Vision API call failed: {e}") from e
        except Exception as e:
            logger.exception("Unexpected Vision API error.")
            raise RuntimeError(f"Vision API call failed: {e}") from e

        if response.error.message:
            logger.error("Vision API returned error: %s", response.error.message)
            raise RuntimeError(
                f"Vision API error {response.error.code}: {response.error.message}"
            )
        return response

    def _score_structured_result(self, result: OCRStructuredResult) -> float:
        """Heuristic score to select best OCR variant."""
        word_count = 0
        conf_sum = 0.0
        line_count = 0
        for page in result.pages:
            line_count += len(page.lines)
            for line in page.lines:
                for word in line.words:
                    word_count += 1
                    conf_sum += float(word.confidence or 0.0)

        avg_conf = (conf_sum / word_count) if word_count else 0.0
        # Favor denser readable output while accounting for confidence.
        return (word_count * 1.8) + (line_count * 1.2) + (avg_conf * 100.0)

    # -----------------------------
    # Response parsing
    # -----------------------------

    def _parse_response(self, response: Any) -> OCRStructuredResult:
        """Convert Vision DOCUMENT_TEXT_DETECTION response to structured result.

        Also builds legacy-style 'rows' by clustering words with similar y
        coordinates, preserving table structure for AnalysisService.
        """
        full_text = response.full_text_annotation.text or ""
        pages: List[OCRPage] = []
        text_items: List[Dict[str, Any]] = []

        for page_index, page in enumerate(response.full_text_annotation.pages):
            ocr_page = OCRPage(
                page_number=page_index + 1,
                width=page.width,
                height=page.height,
                lines=[],
            )

            for block in page.blocks:
                for paragraph in block.paragraphs:
                    words: List[OCRWord] = []
                    line_text_parts: List[str] = []
                    confidences: List[float] = []

                    for word in paragraph.words:
                        word_text = "".join([s.text for s in word.symbols])
                        line_text_parts.append(word_text)
                        confidences.append(word.confidence)
                        vertices = [(v.x or 0, v.y or 0) for v in word.bounding_box.vertices]

                        # Collect for legacy row grouping (similar to EasyOCR coords logic)
                        if len(vertices) >= 3:
                            y_center = (vertices[0][1] + vertices[2][1]) / 2.0
                            x_center = (vertices[0][0] + vertices[2][0]) / 2.0
                            width = vertices[1][0] - vertices[0][0]
                            text_items.append(
                                {
                                    "text": word_text,
                                    "y": y_center,
                                    "x": x_center,
                                    "width": width,
                                }
                            )

                        words.append(
                            OCRWord(
                                text=word_text,
                                confidence=word.confidence,
                                bbox=vertices,
                            )
                        )

                    if not line_text_parts:
                        continue

                    line_text = " ".join(line_text_parts)
                    avg_conf = (
                        float(sum(confidences) / len(confidences))
                        if confidences
                        else 0.0
                    )

                    ocr_page.lines.append(
                        OCRLine(text=line_text, confidence=avg_conf, words=words)
                    )

            pages.append(ocr_page)

        # Legacy-style row grouping: sort by y-bucket then x, cluster nearby y
        rows: List[str] = []
        if text_items:
            text_items.sort(key=lambda t: (int(t["y"] / 25), t["x"]))

            current_row: List[Dict[str, Any]] = []
            current_y = -100.0

            for item in text_items:
                if abs(item["y"] - current_y) > 20:
                    if current_row:
                        current_row.sort(key=lambda t: t["x"])
                        row_text = " | ".join([t["text"] for t in current_row])
                        rows.append(row_text)
                    current_row = [item]
                    current_y = item["y"]
                else:
                    current_row.append(item)

            if current_row:
                current_row.sort(key=lambda t: t["x"])
                row_text = " | ".join([t["text"] for t in current_row])
                rows.append(row_text)

        return OCRStructuredResult(
            full_text=full_text.strip(),
            pages=pages,
            key_values={},
            rows=rows,
        )

    # -----------------------------
    # Key-value extraction (bonus)
    # -----------------------------

    def _extract_key_values(self, text: str) -> Dict[str, str]:
        """Heuristic key-value extraction from OCR text."""
        key_patterns: Dict[str, List[str]] = {
            "name": [r"\bname\b", r"\bapplicant\b"],
            "survey_number": [r"\bsurvey\s*no\.?\b", r"\bsy\.?\s*no\.?\b"],
            "village": [r"\bvillage\b"],
            "taluk": [r"\btaluk\b"],
        }

        lines = [line.strip() for line in text.splitlines() if line.strip()]
        lower_lines = [line.lower() for line in lines]

        result: Dict[str, str] = {}
        for logical_key, patterns in key_patterns.items():
            value = self._find_value_for_key(patterns, lines, lower_lines)
            if value:
                result[logical_key] = value
        return result

    @staticmethod
    def _find_value_for_key(
        patterns: List[str],
        lines: List[str],
        lower_lines: List[str],
    ) -> Optional[str]:
        for idx, line_lower in enumerate(lower_lines):
            for pat in patterns:
                if re.search(pat, line_lower):
                    original_line = lines[idx]
                    for sep in [":", "-", "=", "–", "—"]:
                        if sep in original_line:
                            parts = original_line.split(sep, 1)
                            if len(parts) == 2:
                                candidate = parts[1].strip()
                                if candidate:
                                    return candidate
                    if idx + 1 < len(lines):
                        return lines[idx + 1].strip()
        return None
