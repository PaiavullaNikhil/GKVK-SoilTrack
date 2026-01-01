"""Analysis service for PaddleOCR output."""

import re
from typing import List, Tuple, Dict
from models import SoilData, NutrientStatus


class AnalysisService:
    """Parse PaddleOCR's structured output."""

    PARAM_ORDER = [
        "ph", "ec", "organic_carbon", "nitrogen", "phosphorus", "potassium",
        "sulphur", "zinc", "boron", "iron", "manganese", "copper"
    ]

    # Patterns to match parameter names (English and Kannada)
    PARAM_PATTERNS = {
        "ph": [r"pH", r"\(pH\)", r"ಪಿ\.?ಹೆಚ್", r"ರಸಸಾರ"],
        "ec": [r"EC", r"E\.?C", r"\(EC\)", r"\(E\.?C\)", r"ಇ\.?ಸಿ", r"ವಿದ್ಯುತ್", r"ವಾಹಕತೆ"],
        "organic_carbon": [r"OC", r"\(OC\)", r"\(?C\)", r"ಸಾವಯವ", r"ಇಂಗಾಲ", r"Organic"],
        "nitrogen": [r"\bN\b", r"\(N\)", r"TN", r"ಸಾರಜನಕ", r"Nitrogen"],
        "phosphorus": [r"P2O5", r"P205", r"P2o5", r"\(P2", r"ರಂಜಕ", r"Phosphorus"],
        "potassium": [r"K2O", r"K20", r"\(K2", r"ಪೊಟ್ಯಾಶ್", r"ಪೊಟ್ಯಾಷ್", r"Potassium"],
        "sulphur": [r"\bS\b", r"\(S\)", r"ಗಂಧಕ", r"Sulphur"],
        "zinc": [r"Zn", r"ZR", r"\(Zn\)", r"\(ZR\)", r"ಸತು", r"Zinc"],
        "boron": [r"\bB\b", r"\(B\)", r"ಬೋರಾನ್", r"Boron"],
        "iron": [r"Fe", r"\(Fe\)", r"ಕಬ್ಬಿಣ", r"Iron"],
        "manganese": [r"Mn", r"\(Mn\)", r"ಮ್ಯಾಂಗನೀಸ್", r"Manganese"],
        "copper": [r"Cu", r"\(Cu\)", r"ತಾಮ್ರ", r"Copper"],
    }

    # Status keywords in Kannada and their colors
    STATUS_MAP = {
        "ಅಧಿಕ ಆಮ್ಲೀಯ": ("#F97316", "Highly Acidic"),
        "ಆಮ್ಲೀಯ": ("#F97316", "Acidic"),
        "ಲವಣ ರಹಿತ": ("#10B981", "Salt Free"),
        "ಸಾಕಷ್ಟು": ("#10B981", "Sufficient"),
        "ಮಧ್ಯಮ": ("#F59E0B", "Medium"),
        "ಕಡಿಮೆ": ("#EF4444", "Low"),
        "ಹೆಚ್ಚು": ("#10B981", "High"),
        "ಸಾಮಾನ್ಯ": ("#10B981", "Normal"),
        "ತಟಸ್ಥ": ("#10B981", "Neutral"),
        "ಕ್ಷಾರೀಯ": ("#F59E0B", "Alkaline"),
    }

    NUTRIENT_KN = {
        "ph": "ರಸಸಾರ (pH)",
        "ec": "ವಿದ್ಯುತ್ ವಾಹಕತೆ (EC)",
        "organic_carbon": "ಸಾವಯವ ಇಂಗಾಲ (OC)",
        "nitrogen": "ಲಭ್ಯ ಸಾರಜನಕ (N)",
        "phosphorus": "ಲಭ್ಯ ರಂಜಕ (P2O5)",
        "potassium": "ಲಭ್ಯ ಪೊಟ್ಯಾಶ್ (K2O)",
        "sulphur": "ಲಭ್ಯ ಗಂಧಕ (S)",
        "zinc": "ಲಭ್ಯ ಸತು (Zn)",
        "boron": "ಲಭ್ಯ ಬೋರಾನ್ (B)",
        "iron": "ಲಭ್ಯ ಕಬ್ಬಿಣ (Fe)",
        "manganese": "ಲಭ್ಯ ಮ್ಯಾಂಗನೀಸ್ (Mn)",
        "copper": "ಲಭ್ಯ ತಾಮ್ರ (Cu)",
    }

    UNITS = {
        "ph": "", "ec": "dS/m", "organic_carbon": "%",
        "nitrogen": "kg/ha", "phosphorus": "kg/ha", "potassium": "kg/ha",
        "sulphur": "ppm", "zinc": "ppm", "boron": "ppm",
        "iron": "ppm", "manganese": "ppm", "copper": "ppm",
    }

    def _parse_value(self, raw: str) -> float:
        """Parse value to float."""
        if not raw:
            return 0.0
        raw = raw.strip()
        if raw.startswith('>'):
            try: return float(raw[1:])
            except: return 0.0
        if raw.startswith('<'):
            try: return float(raw[1:])
            except: return 0.0
        m = re.match(r'(\d+\.?\d*)\s*[-]\s*(\d+\.?\d*)', raw)
        if m:
            return (float(m.group(1)) + float(m.group(2))) / 2
        try: return float(raw)
        except: return 0.0

    def _find_param(self, text: str) -> str:
        """Find which parameter this text refers to."""
        for param, patterns in self.PARAM_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return param
        return None

    def _find_status(self, text: str) -> Tuple[str, str, str]:
        """Find status keyword in text and return (status_kn, color, status_en)."""
        for status_kn, (color, status_en) in self.STATUS_MAP.items():
            if status_kn in text:
                return (status_kn, color, status_en)
        return ("ಪತ್ತೆಯಾಗಿಲ್ಲ", "#6B7280", "Not Found")

    def _extract_value(self, text: str) -> str:
        """Extract numeric value from text."""
        # Look for patterns like: 5.0-5.5, >0.6, <2, 140-280, etc.
        patterns = [
            r'(\d+\.?\d*\s*[-–]\s*\d+\.?\d*)',  # Range: 5.0-5.5
            r'([><]\s*\d+\.?\d*)',              # Comparison: >0.6, <2
            r'(\d+\.?\d+)',                      # Decimal: 0.75
            r'(\d+)',                            # Integer: 140
        ]
        for pattern in patterns:
            m = re.search(pattern, text)
            if m:
                return m.group(1).replace(' ', '')
        return None

    # Colors: RED=#EF4444, YELLOW=#F59E0B, GREEN=#10B981
    RED = "#EF4444"
    YELLOW = "#F59E0B"
    GREEN = "#10B981"
    GRAY = "#6B7280"

    def _get_status_from_value(self, param: str, value: float) -> Tuple[str, str, str]:
        """Determine status from value using GKVK/UAS thresholds."""
        if value is None:
            return ("ಪತ್ತೆಯಾಗಿಲ್ಲ", self.GRAY, "Not Found")
        
        # pH - special handling with multiple ranges
        if param == "ph":
            if value < 5.5:
                return ("ಆಮ್ಲೀಯ", self.RED, "Acidic")
            elif value <= 6.5:
                return ("ಸ್ವಲ್ಪ ಆಮ್ಲೀಯ", self.YELLOW, "Slightly Acidic")
            elif value <= 7.5:
                return ("ತಟಸ್ಥ", self.GREEN, "Neutral")
            elif value <= 8.5:
                return ("ಸ್ವಲ್ಪ ಕ್ಷಾರೀಯ", self.YELLOW, "Slightly Alkaline")
            else:
                return ("ಕ್ಷಾರೀಯ", self.RED, "Alkaline")
        
        # EC - Electrical Conductivity
        if param == "ec":
            if value < 1.0:
                return ("ಸಾಮಾನ್ಯ", self.GREEN, "Normal")
            elif value <= 2.0:
                return ("ಸ್ವಲ್ಪ ಲವಣ", self.YELLOW, "Slightly Saline")
            else:
                return ("ಲವಣಯುಕ್ತ", self.RED, "Saline")
        
        # Organic Carbon
        if param == "organic_carbon":
            if value < 0.50:
                return ("ಕಡಿಮೆ", self.RED, "Low")
            elif value <= 0.75:
                return ("ಮಧ್ಯಮ", self.YELLOW, "Medium")
            else:
                return ("ಹೆಚ್ಚು", self.GREEN, "High")
        
        # Nitrogen
        if param == "nitrogen":
            if value < 140:
                return ("ಕಡಿಮೆ", self.RED, "Low")
            elif value <= 280:
                return ("ಮಧ್ಯಮ", self.YELLOW, "Medium")
            else:
                return ("ಹೆಚ್ಚು", self.GREEN, "High")
        
        # Phosphorus
        if param == "phosphorus":
            if value < 23:
                return ("ಕಡಿಮೆ", self.RED, "Low")
            elif value <= 57:
                return ("ಮಧ್ಯಮ", self.YELLOW, "Medium")
            else:
                return ("ಹೆಚ್ಚು", self.GREEN, "High")
        
        # Potassium
        if param == "potassium":
            if value < 145:
                return ("ಕಡಿಮೆ", self.RED, "Low")
            elif value <= 337:
                return ("ಮಧ್ಯಮ", self.YELLOW, "Medium")
            else:
                return ("ಹೆಚ್ಚು", self.GREEN, "High")
        
        # Sulphur
        if param == "sulphur":
            if value < 10:
                return ("ಕಡಿಮೆ", self.RED, "Low")
            elif value <= 20:
                return ("ಮಧ್ಯಮ", self.YELLOW, "Medium")
            else:
                return ("ಹೆಚ್ಚು", self.GREEN, "High")
        
        # Zinc - critical limit based
        if param == "zinc":
            if value < 0.6:
                return ("ಕೊರತೆ", self.RED, "Deficient")
            else:
                return ("ಸಾಕಷ್ಟು", self.GREEN, "Sufficient")
        
        # Boron
        if param == "boron":
            if value < 0.5:
                return ("ಕೊರತೆ", self.RED, "Deficient")
            elif value <= 1.0:
                return ("ಮಧ್ಯಮ", self.YELLOW, "Medium")
            else:
                return ("ಸಾಕಷ್ಟು", self.GREEN, "Sufficient")
        
        # Iron - critical limit based
        if param == "iron":
            if value < 4.5:
                return ("ಕೊರತೆ", self.RED, "Deficient")
            else:
                return ("ಸಾಕಷ್ಟು", self.GREEN, "Sufficient")
        
        # Manganese - critical limit based
        if param == "manganese":
            if value < 1.0:
                return ("ಕೊರತೆ", self.RED, "Deficient")
            else:
                return ("ಸಾಕಷ್ಟು", self.GREEN, "Sufficient")
        
        # Copper - critical limit based
        if param == "copper":
            if value < 0.2:
                return ("ಕೊರತೆ", self.RED, "Deficient")
            else:
                return ("ಸಾಕಷ್ಟು", self.GREEN, "Sufficient")
        
        return ("ಪತ್ತೆಯಾಗಿಲ್ಲ", self.GRAY, "Not Found")

    def analyze_soil_card(self, ocr_text: str) -> Tuple[SoilData, Dict, Dict]:
        """Parse OCR output to extract soil data."""
        soil_data = SoilData()
        raw_values = {}
        status_info = {}
        
        print(f"\n{'='*60}", flush=True)
        print("ANALYZING OCR OUTPUT", flush=True)
        print(f"{'='*60}", flush=True)
        
        # Split into rows
        rows = ocr_text.strip().split('\n')
        
        found = {}
        
        for row in rows:
            # Find which parameter this row is about
            param = self._find_param(row)
            if not param:
                continue
            
            if param in found:
                continue
            
            # Extract value
            value = self._extract_value(row)
            
            # Try to extract Kannada status
            status_kn, color, status_en = self._find_status(row)
            
            # If status not found in OCR, calculate from value
            if status_kn == "ಪತ್ತೆಯಾಗಿಲ್ಲ" and value:
                parsed_val = self._parse_value(value)
                status_kn, color, _ = self._get_status_from_value(param, parsed_val)
            
            found[param] = {
                'value': value,
                'status_kn': status_kn,
                'color': color,
                'status_en': status_en,
                'row': row
            }
            
            print(f"  Found {param}: value={value}", flush=True)
        
        # Build output for all 12 parameters
        print(f"\nRESULTS ({len(found)}/12 found):", flush=True)
        for i, param in enumerate(self.PARAM_ORDER):
            if param in found:
                d = found[param]
                raw = d['value'] or ''
                status_kn = d['status_kn']
                color = d['color']
                
                setattr(soil_data, param, round(self._parse_value(raw), 2) if raw else None)
                raw_values[param] = raw
                status_info[param] = ("ocr", color, status_kn)
                
                print(f"  {i+1:02d}. {param:15s}: {raw:12s} | [status]", flush=True)
            else:
                status_info[param] = ("missing", "#6B7280", "ಪತ್ತೆಯಾಗಿಲ್ಲ")
                print(f"  {i+1:02d}. {param:15s}: NOT FOUND", flush=True)
        
        print(f"{'='*60}\n", flush=True)
        return soil_data, raw_values, status_info

    def get_nutrient_status(self, soil_data, raw_values=None, status_info=None):
        if not raw_values: raw_values = {}
        if not status_info: status_info = {}
        
        result = []
        for param in self.PARAM_ORDER:
            value = getattr(soil_data, param, None)
            raw = raw_values.get(param)
            _, color, status_kn = status_info.get(param, ("", "#6B7280", "ಪತ್ತೆಯಾಗಿಲ್ಲ"))
            
            result.append(NutrientStatus(
                nutrient=param.replace("_", " ").title(),
                nutrient_kn=self.NUTRIENT_KN.get(param, param),
                value=value,
                value_raw=raw,
                unit=self.UNITS.get(param, ""),
                status="ocr",
                status_kn=status_kn,
                color=color,
            ))
        return result
