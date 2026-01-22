"""OCR service - try original image first for better Kannada."""

import cv2
import numpy as np
from PIL import Image
import easyocr
import os

# Initialize EasyOCR with English and Kannada
print("Initializing EasyOCR...", flush=True)
reader = easyocr.Reader(['en', 'kn'], gpu=False)
print("EasyOCR ready!", flush=True)


class OCRService:
    """Extract soil data using EasyOCR."""

    def __init__(self):
        self.reader = reader
        print("OCRService initialized!", flush=True)

    def extract_text(self, image_input) -> str:
        """Extract text from soil health card image.
        
        Args:
            image_input: Can be either:
                - str: File path to image
                - bytes: Image bytes data
                - numpy.ndarray: Image array
        """
        print(f"Processing image (type: {type(image_input).__name__})", flush=True)
        
        try:
            # Convert bytes or numpy array to format EasyOCR can use
            if isinstance(image_input, bytes):
                import numpy as np
                from PIL import Image
                import io
                # Convert bytes to PIL Image, then to numpy array
                image = Image.open(io.BytesIO(image_input))
                image_array = np.array(image)
                print("Converted bytes to numpy array", flush=True)
            elif isinstance(image_input, str):
                # File path - use directly
                image_array = image_input
                print(f"Using file path: {image_input}", flush=True)
            else:
                # Assume it's already a numpy array
                image_array = image_input
                print("Using provided numpy array", flush=True)
            
            # First try: Original image (preserves colors for Kannada)
            print("Trying original image...", flush=True)
            result = self.reader.readtext(image_array, paragraph=False)
            
            if not result:
                print("No text detected!", flush=True)
                return ""
            
            # Collect all text with coordinates
            text_items = []
            for detection in result:
                coords = detection[0]
                text = detection[1]
                confidence = detection[2]
                
                y_center = (coords[0][1] + coords[2][1]) / 2
                x_center = (coords[0][0] + coords[2][0]) / 2
                width = coords[1][0] - coords[0][0]
                
                text_items.append({
                    'text': text,
                    'y': y_center,
                    'x': x_center,
                    'width': width,
                    'confidence': confidence,
                    'coords': coords
                })
            
            # Sort by y then x
            text_items.sort(key=lambda t: (int(t['y'] / 25), t['x']))
            
            # Group into rows
            rows = []
            current_row = []
            current_y = -100
            
            for item in text_items:
                if abs(item['y'] - current_y) > 20:
                    if current_row:
                        current_row.sort(key=lambda t: t['x'])
                        row_text = ' | '.join([t['text'] for t in current_row])
                        rows.append(row_text)
                    current_row = [item]
                    current_y = item['y']
                else:
                    current_row.append(item)
            
            if current_row:
                current_row.sort(key=lambda t: t['x'])
                row_text = ' | '.join([t['text'] for t in current_row])
                rows.append(row_text)
            
            full_text = '\n'.join(rows)
            
            # Save OCR output (only if it's a file path, skip for in-memory processing)
            if isinstance(image_input, str):
                debug_file = image_input.replace('.jpeg', '_ocr.txt').replace('.jpg', '_ocr.txt')
                try:
                    with open(debug_file, 'w', encoding='utf-8') as f:
                        f.write(full_text)
                except:
                    pass  # Skip debug file if can't write
            
            # Check if we got Kannada text
            has_kannada = any(ord(c) >= 0x0C80 and ord(c) <= 0x0CFF for c in full_text)
            print(f"Kannada text detected: {has_kannada}", flush=True)
            
            print(f"\n=== OCR EXTRACTED {len(rows)} ROWS ===", flush=True)
            for i, row in enumerate(rows[:15]):
                try:
                    print(f"  Row {i+1}: {row}", flush=True)
                except:
                    print(f"  Row {i+1}: [Kannada text]", flush=True)
            print("=== END OCR ===\n", flush=True)
            
            # Apply common corrections
            corrections = {
                '05-1.0': '0.5-1.0',
                '05-0.75': '0.5-0.75',
                '5.05.5': '5.0-5.5',
                ';5.05.5': '5.0-5.5',
                '5y0,6': '>0.6',
                '5y0.6': '>0.6',
                '?4.5': '>4.5',
                '?0.2': '>0.2',
                '>0:2': '>0.2',
                '>1:0': '>1.0',
                'ZR': 'Zn',
            }
            for wrong, correct in corrections.items():
                full_text = full_text.replace(wrong, correct)
            
            return full_text
            
        except Exception as e:
            print(f"OCR error: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return ""
