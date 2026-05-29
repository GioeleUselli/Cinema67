#!/usr/bin/env python3
"""
Cinema67 Presentation HTML to PDF Converter
Requires: pip install weasyprint

Usage:
    python convert_to_pdf.py docs/PRESENTATION.html docs/Cinema67_Presentazione.pdf
"""

import sys
import os

def convert_html_to_pdf(html_file, output_pdf):
    """Convert HTML presentation to PDF using WeasyPrint"""
    try:
        from weasyprint import HTML
        print(f"📄 Converting {html_file} to PDF...")
        print(f"⏳ This may take a moment...")
        
        HTML(html_file).write_pdf(output_pdf)
        
        print(f"✅ PDF created successfully!")
        print(f"📁 Output: {output_pdf}")
        print(f"📊 File size: {os.path.getsize(output_pdf) / (1024*1024):.2f} MB")
        
    except ImportError:
        print("❌ WeasyPrint not installed!")
        print("\n📦 Install with:")
        print("   pip install weasyprint")
        print("\n💡 Or convert manually:")
        print("   1. Open PRESENTATION.html in Chrome")
        print("   2. Ctrl+P to print")
        print("   3. Select 'Save as PDF'")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        html_file = "docs/PRESENTATION.html"
        pdf_file = "docs/Cinema67_Presentazione.pdf"
    else:
        html_file = sys.argv[1]
        pdf_file = sys.argv[2] if len(sys.argv) > 2 else sys.argv[1].replace('.html', '.pdf')
    
    if not os.path.exists(html_file):
        print(f"❌ File not found: {html_file}")
        sys.exit(1)
    
    convert_html_to_pdf(html_file, pdf_file)

if __name__ == "__main__":
    main()
