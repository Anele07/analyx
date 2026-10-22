import pandas as pd
from pypdf import PdfReader

def extract_text_from_file(uploaded_file, filename=None):
    """
    Extracts customer reviews/comments from PDF, Excel, or CSV files.
    Returns a pandas DataFrame containing a 'text' column.
    """
    file_name = (filename or uploaded_file.name).lower()
    
    if file_name.endswith('.csv'):
        df = pd.read_csv(uploaded_file)
        return df
        
    elif file_name.endswith('.xlsx'):
        df = pd.read_excel(uploaded_file)
        return df
        
    elif file_name.endswith('.pdf'):
        reader = PdfReader(uploaded_file)
        extracted_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                # Split by lines or sentences to isolate individual feedback items
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                extracted_text.extend(lines)
                
        return pd.DataFrame({'text': extracted_text})
        
    else:
        raise ValueError("Unsupported file format. Please upload PDF, Excel, or CSV files.")