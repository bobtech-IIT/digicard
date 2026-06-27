#!/usr/bin/env python3
"""
GlassCard AI - Server-side Card to PNG/PDF Converter
Converts card data to high-quality PNG and PDF formats offline.
Works around html2canvas OKLCH color parsing issues.
"""

import json
import sys
import base64
from io import BytesIO
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import qrcode


class CardConverter:
    """Convert card data to PNG and PDF formats."""
    
    # Color palette: Turquoise to Deep Green
    COLORS = {
        'turquoise': '#14b8a6',
        'teal': '#0d9488',
        'deep_teal': '#0891b2',
        'deep_green': '#047857',
        'light_bg': '#f0fdfa',
        'white': '#ffffff',
        'dark_text': '#1f2937',
        'light_text': '#6b7280',
    }
    
    def __init__(self, card_data: Dict[str, Any], aspect_ratio: str = '3:4'):
        """
        Initialize converter with card data.
        
        Args:
            card_data: Dictionary containing card information
            aspect_ratio: '3:4' for vertical, '16:9' for horizontal
        """
        self.card_data = card_data
        self.aspect_ratio = aspect_ratio
        
        # Set dimensions based on aspect ratio
        if aspect_ratio == '16:9':
            self.width = 1600
            self.height = 900
        else:  # Default to 3:4 vertical
            self.width = 900
            self.height = 1200
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _create_base_image(self) -> Image.Image:
        """Create base image with glassmorphic background."""
        # Create light turquoise background
        bg_color = self._hex_to_rgb(self.COLORS['light_bg'])
        img = Image.new('RGB', (self.width, self.height), bg_color)
        
        # Add subtle gradient effect by drawing semi-transparent rectangles
        draw = ImageDraw.Draw(img, 'RGBA')
        
        # Gradient from turquoise to green
        for y in range(self.height):
            ratio = y / self.height
            r = int(240 + (4 - 240) * ratio)
            g = int(253 + (135 - 253) * ratio)
            b = int(250 + (135 - 250) * ratio)
            draw.line([(0, y), (self.width, y)], fill=(r, g, b, 255))
        
        return img
    
    def _add_glassmorphic_card(self, img: Image.Image) -> Image.Image:
        """Add glassmorphic card container."""
        draw = ImageDraw.Draw(img, 'RGBA')
        
        # Card dimensions with padding
        padding = 40
        card_x1 = padding
        card_y1 = padding
        card_x2 = self.width - padding
        card_y2 = self.height - padding
        
        # Draw semi-transparent white card with border
        card_color = (240, 253, 250, 200)  # Light turquoise with transparency
        border_color = self._hex_to_rgb(self.COLORS['turquoise']) + (100,)
        
        # Draw filled rectangle
        draw.rectangle(
            [(card_x1, card_y1), (card_x2, card_y2)],
            fill=card_color,
            outline=border_color,
            width=2
        )
        
        # Draw rounded corners effect
        corner_radius = 20
        for corner_x, corner_y in [(card_x1, card_y1), (card_x2, card_y1), 
                                    (card_x1, card_y2), (card_x2, card_y2)]:
            draw.ellipse(
                [(corner_x - corner_radius, corner_y - corner_radius),
                 (corner_x + corner_radius, corner_y + corner_radius)],
                fill=card_color,
                outline=border_color
            )
        
        return img
    
    def _add_text(self, img: Image.Image, text: str, position: Tuple[int, int], 
                  font_size: int = 40, color: str = 'dark_text', 
                  max_width: Optional[int] = None, bold: bool = False) -> Tuple[Image.Image, int]:
        """
        Add text to image with word wrapping.
        
        Returns:
            Tuple of (modified image, height used)
        """
        draw = ImageDraw.Draw(img)
        
        try:
            # Try to load Poppins font
            font_name = "Poppins-Bold" if bold else "Poppins-Regular"
            font = ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{font_name}.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
        
        text_color = self._hex_to_rgb(self.COLORS[color])
        x, y = position
        
        if max_width is None:
            max_width = self.width - 80
        
        # Word wrap
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            line_width = bbox[2] - bbox[0]
            
            if line_width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        # Draw lines
        current_y = y
        line_height = font_size + 10
        
        for line in lines:
            draw.text((x, current_y), line, fill=text_color, font=font)
            current_y += line_height
        
        return img, current_y - y
    
    def _add_qr_code(self, img: Image.Image, vcard_data: str, 
                     position: Tuple[int, int], size: int = 150) -> Image.Image:
        """Add QR code to image."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(vcard_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_img = qr_img.resize((size, size), Image.Resampling.LANCZOS)
        
        img.paste(qr_img, position)
        return img
    
    def _add_social_icons(self, img: Image.Image, social_data: Dict[str, str], 
                         position: Tuple[int, int]) -> Image.Image:
        """Add social media icons/links to image."""
        draw = ImageDraw.Draw(img)
        
        social_platforms = ['linkedin', 'twitter', 'instagram', 'facebook', 
                           'youtube', 'github', 'tiktok', 'whatsapp']
        
        icon_size = 30
        spacing = 40
        x, y = position
        
        for i, platform in enumerate(social_platforms):
            if platform in social_data and social_data[platform]:
                # Draw circle background
                circle_x = x + (i % 4) * spacing
                circle_y = y + (i // 4) * spacing
                
                draw.ellipse(
                    [(circle_x, circle_y), (circle_x + icon_size, circle_y + icon_size)],
                    fill=self._hex_to_rgb(self.COLORS['turquoise']),
                    outline=self._hex_to_rgb(self.COLORS['deep_green'])
                )
                
                # Add platform initial
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
                except:
                    font = ImageFont.load_default()
                
                initial = platform[0].upper()
                draw.text(
                    (circle_x + 8, circle_y + 7),
                    initial,
                    fill=(255, 255, 255),
                    font=font
                )
        
        return img
    
    def to_png(self) -> bytes:
        """Convert card to PNG format."""
        img = self._create_base_image()
        img = self._add_glassmorphic_card(img)
        
        # Add content
        y_offset = 100
        
        # Logo/Brand
        if self.card_data.get('office_name'):
            img, height = self._add_text(
                img, 
                self.card_data['office_name'],
                (100, y_offset),
                font_size=36,
                color='turquoise',
                bold=True
            )
            y_offset += height + 30
        
        # Headshot (placeholder circle)
        if self.card_data.get('headshot'):
            try:
                headshot = Image.open(BytesIO(base64.b64decode(self.card_data['headshot'])))
                headshot = headshot.resize((150, 150), Image.Resampling.LANCZOS)
                # Create circular mask
                mask = Image.new('L', (150, 150), 0)
                mask_draw = ImageDraw.Draw(mask)
                mask_draw.ellipse([(0, 0), (150, 150)], fill=255)
                headshot.putalpha(mask)
                img.paste(headshot, (self.width // 2 - 75, y_offset), headshot)
                y_offset += 180
            except:
                pass
        
        # Name
        if self.card_data.get('name'):
            img, height = self._add_text(
                img,
                self.card_data['name'],
                (100, y_offset),
                font_size=48,
                color='dark_text',
                bold=True
            )
            y_offset += height + 10
        
        # Designation
        if self.card_data.get('designation'):
            img, height = self._add_text(
                img,
                self.card_data['designation'],
                (100, y_offset),
                font_size=32,
                color='turquoise'
            )
            y_offset += height + 20
        
        # Contact info
        if self.card_data.get('phone'):
            img, height = self._add_text(
                img,
                f"📞 {self.card_data['phone']}",
                (100, y_offset),
                font_size=24,
                color='light_text'
            )
            y_offset += height + 10
        
        if self.card_data.get('email'):
            img, height = self._add_text(
                img,
                f"✉️ {self.card_data['email']}",
                (100, y_offset),
                font_size=24,
                color='light_text'
            )
            y_offset += height + 10
        
        if self.card_data.get('address'):
            img, height = self._add_text(
                img,
                f"📍 {self.card_data['address']}",
                (100, y_offset),
                font_size=24,
                color='light_text'
            )
            y_offset += height + 20
        
        # Office details
        if self.card_data.get('office_details'):
            img, height = self._add_text(
                img,
                self.card_data['office_details'],
                (100, y_offset),
                font_size=20,
                color='light_text'
            )
            y_offset += height + 30
        
        # QR Code
        if self.card_data.get('vcard'):
            qr_position = (self.width - 200, self.height - 250)
            img = self._add_qr_code(img, self.card_data['vcard'], qr_position, size=150)
        
        # Convert to PNG bytes
        png_buffer = BytesIO()
        img.save(png_buffer, format='PNG', quality=95)
        png_buffer.seek(0)
        return png_buffer.getvalue()
    
    def to_pdf(self) -> bytes:
        """Convert card to PDF format."""
        pdf_buffer = BytesIO()
        
        # Determine page size
        if self.aspect_ratio == '16:9':
            page_size = landscape(letter)
        else:
            page_size = letter
        
        c = canvas.Canvas(pdf_buffer, pagesize=page_size)
        
        # Draw background
        c.setFillColor(HexColor(self.COLORS['light_bg']))
        c.rect(0, 0, page_size[0], page_size[1], fill=1, stroke=0)
        
        # Draw glassmorphic card border
        c.setStrokeColor(HexColor(self.COLORS['turquoise']))
        c.setLineWidth(2)
        margin = 0.3 * inch
        c.rect(
            margin, margin,
            page_size[0] - 2 * margin,
            page_size[1] - 2 * margin,
            fill=0, stroke=1
        )
        
        # Add content
        y = page_size[1] - 1 * inch
        
        # Logo/Brand
        if self.card_data.get('office_name'):
            c.setFont("Helvetica-Bold", 24)
            c.setFillColor(HexColor(self.COLORS['turquoise']))
            c.drawString(1 * inch, y, self.card_data['office_name'])
            y -= 0.5 * inch
        
        # Name
        if self.card_data.get('name'):
            c.setFont("Helvetica-Bold", 32)
            c.setFillColor(HexColor(self.COLORS['dark_text']))
            c.drawString(1 * inch, y, self.card_data['name'])
            y -= 0.5 * inch
        
        # Designation
        if self.card_data.get('designation'):
            c.setFont("Helvetica", 18)
            c.setFillColor(HexColor(self.COLORS['turquoise']))
            c.drawString(1 * inch, y, self.card_data['designation'])
            y -= 0.4 * inch
        
        # Contact info
        c.setFont("Helvetica", 12)
        c.setFillColor(HexColor(self.COLORS['light_text']))
        
        if self.card_data.get('phone'):
            c.drawString(1 * inch, y, f"Phone: {self.card_data['phone']}")
            y -= 0.3 * inch
        
        if self.card_data.get('email'):
            c.drawString(1 * inch, y, f"Email: {self.card_data['email']}")
            y -= 0.3 * inch
        
        if self.card_data.get('address'):
            c.drawString(1 * inch, y, f"Address: {self.card_data['address']}")
            y -= 0.3 * inch
        
        if self.card_data.get('office_details'):
            c.drawString(1 * inch, y, f"Office: {self.card_data['office_details']}")
            y -= 0.3 * inch
        
        # QR Code
        if self.card_data.get('vcard'):
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=2,
            )
            qr.add_data(self.card_data['vcard'])
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)
            
            c.drawImage(qr_buffer, page_size[0] - 1.5 * inch, 0.5 * inch, 
                       width=1 * inch, height=1 * inch)
        
        c.save()
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()


def main():
    """Main entry point for CLI usage."""
    if len(sys.argv) < 3:
        print("Usage: python card-converter.py <input_json> <output_format> [aspect_ratio]")
        print("  input_json: JSON file with card data")
        print("  output_format: 'png' or 'pdf'")
        print("  aspect_ratio: '3:4' (default) or '16:9'")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_format = sys.argv[2].lower()
    aspect_ratio = sys.argv[3] if len(sys.argv) > 3 else '3:4'
    
    # Load card data
    with open(input_file, 'r') as f:
        card_data = json.load(f)
    
    # Convert
    converter = CardConverter(card_data, aspect_ratio)
    
    if output_format == 'png':
        output = converter.to_png()
        output_file = input_file.replace('.json', '.png')
    elif output_format == 'pdf':
        output = converter.to_pdf()
        output_file = input_file.replace('.json', '.pdf')
    else:
        print(f"Unknown format: {output_format}")
        sys.exit(1)
    
    # Save output
    with open(output_file, 'wb') as f:
        f.write(output)
    
    print(f"✅ Converted to {output_file}")


if __name__ == '__main__':
    main()
