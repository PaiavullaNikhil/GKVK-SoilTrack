"""Service for analyzing soil health card data."""

import re
from typing import List, Optional
from models import SoilData, NutrientStatus


class AnalysisService:
    """Service for soil data analysis."""

    # Nutrient thresholds based on Indian soil standards
    THRESHOLDS = {
        "ph": {"low": (0, 6.0), "medium": (6.0, 7.5), "high": (7.5, 14)},
        "nitrogen": {"low": (0, 280), "medium": (280, 560), "high": (560, 9999)},
        "phosphorus": {"low": (0, 10), "medium": (10, 25), "high": (25, 9999)},
        "potassium": {"low": (0, 120), "medium": (120, 280), "high": (280, 9999)},
        "organic_carbon": {"low": (0, 0.5), "medium": (0.5, 0.75), "high": (0.75, 9999)},
        "ec": {"low": (0, 1.0), "medium": (1.0, 2.0), "high": (2.0, 9999)},
    }

    # Status colors
    STATUS_COLORS = {
        "low": "#EF4444",  # Red
        "medium": "#F59E0B",  # Amber
        "high": "#10B981",  # Green
    }

    # Kannada translations
    STATUS_KN = {
        "low": "ಕಡಿಮೆ",
        "medium": "ಮಧ್ಯಮ",
        "high": "ಹೆಚ್ಚು",
    }

    NUTRIENT_KN = {
        "ph": "ಪಿ.ಎಚ್",
        "nitrogen": "ಸಾರಜನಕ (N)",
        "phosphorus": "ರಂಜಕ (P)",
        "potassium": "ಪೊಟ್ಯಾಸಿಯಂ (K)",
        "organic_carbon": "ಸಾವಯವ ಇಂಗಾಲ",
        "ec": "ವಿದ್ಯುತ್ ವಾಹಕತೆ",
    }

    def _safe_float(self, value: Optional[str]) -> Optional[float]:
        """Safely convert string to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    def _extract_number(self, text: str, patterns: List[str]) -> Optional[float]:
        """Extract a number following any of the given patterns."""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Try to get the captured group
                try:
                    value = match.group(1)
                    if value:
                        return self._safe_float(value)
                except (IndexError, AttributeError):
                    pass
        return None

    def analyze_soil_card(self, ocr_text: str) -> SoilData:
        """
        Extract soil parameters from OCR text.

        Args:
            ocr_text: Raw text from OCR

        Returns:
            SoilData object with extracted values
        """
        soil_data = SoilData()
        text = ocr_text.lower()

        # Extract pH - look for "ph" followed by a number
        soil_data.ph = self._extract_number(text, [
            r"ph\s*[:\-]?\s*(\d+\.?\d*)",
            r"(\d+\.?\d*)\s*ph",
        ])

        # Extract Nitrogen (N) - kg/ha
        soil_data.nitrogen = self._extract_number(text, [
            r"nitrogen\s*[:\-]?\s*(\d+\.?\d*)",
            r"available\s*n\s*[:\-]?\s*(\d+\.?\d*)",
            r"\bn\s*[:\-]\s*(\d+\.?\d*)",
        ])

        # Extract Phosphorus (P) - kg/ha
        soil_data.phosphorus = self._extract_number(text, [
            r"phosphorus\s*[:\-]?\s*(\d+\.?\d*)",
            r"available\s*p\s*[:\-]?\s*(\d+\.?\d*)",
            r"\bp\s*[:\-]\s*(\d+\.?\d*)",
        ])

        # Extract Potassium (K) - kg/ha
        soil_data.potassium = self._extract_number(text, [
            r"potassium\s*[:\-]?\s*(\d+\.?\d*)",
            r"available\s*k\s*[:\-]?\s*(\d+\.?\d*)",
            r"\bk\s*[:\-]\s*(\d+\.?\d*)",
        ])

        # Extract Organic Carbon
        soil_data.organic_carbon = self._extract_number(text, [
            r"organic\s*carbon\s*[:\-]?\s*(\d+\.?\d*)",
            r"oc\s*[:\-]\s*(\d+\.?\d*)",
        ])

        # Extract EC (Electrical Conductivity)
        soil_data.ec = self._extract_number(text, [
            r"electrical\s*conductivity\s*[:\-]?\s*(\d+\.?\d*)",
            r"ec\s*[:\-]\s*(\d+\.?\d*)",
            r"ec\s*<\s*(\d+\.?\d*)",
        ])

        return soil_data

    def get_nutrient_status(self, soil_data: SoilData) -> List[NutrientStatus]:
        """
        Determine status of each nutrient.

        Args:
            soil_data: Extracted soil data

        Returns:
            List of NutrientStatus objects
        """
        statuses = []

        nutrients = {
            "ph": (soil_data.ph, ""),
            "nitrogen": (soil_data.nitrogen, "kg/ha"),
            "phosphorus": (soil_data.phosphorus, "kg/ha"),
            "potassium": (soil_data.potassium, "kg/ha"),
            "organic_carbon": (soil_data.organic_carbon, "%"),
            "ec": (soil_data.ec, "dS/m"),
        }

        for nutrient, (value, unit) in nutrients.items():
            status = self._determine_status(nutrient, value)
            statuses.append(
                NutrientStatus(
                    nutrient=nutrient.replace("_", " ").title(),
                    nutrient_kn=self.NUTRIENT_KN.get(nutrient, nutrient),
                    value=value,
                    unit=unit,
                    status=status,
                    status_kn=self.STATUS_KN.get(status, status),
                    color=self.STATUS_COLORS.get(status, "#6B7280"),
                )
            )

        return statuses

    def _determine_status(self, nutrient: str, value: Optional[float]) -> str:
        """Determine status based on threshold."""
        if value is None:
            return "medium"  # Default if no value

        thresholds = self.THRESHOLDS.get(nutrient, {})

        for status, (min_val, max_val) in thresholds.items():
            if min_val <= value < max_val:
                return status

        return "medium"
