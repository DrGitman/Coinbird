from xhtml2pdf import pisa
from io import BytesIO

def generate_pdf(html_content: str):
    """
    Converts HTML content into a PDF binary stream.
    Returns: BytesIO object containing the PDF data.
    """
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html_content.encode("utf-8")), result)
    
    if not pdf.err:
        result.seek(0)
        return result
    else:
        print("Error generating PDF:", pdf.err)
        return None
