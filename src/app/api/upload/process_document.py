import sys
import json
import os
from typing import Dict, Any
from docling.document_converter import DocumentConverter

# Create processed directory if it doesn't exist
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

def process_document(file_path: str, output_path: str) -> Dict[str, Any]:
    """
    Process a document using Docling's simple converter
    
    Args:
        file_path (str): Path to the uploaded document
        output_path (str): Path to save the processed output
        
    Returns:
        Dict: Result dictionary with document data
    """
    try:
        # Create a simple converter without complex options
        converter = DocumentConverter()
        
        # Convert the document
        result = converter.convert(file_path)
        
        # Export to dictionary format
        doc_json = result.document.export_to_dict()
        
        # Save the result to output file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(doc_json, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully processed document.")
        return doc_json
        
    except Exception as e:
        print(f"Error processing document: {e}")
        # Clean up any temporary files
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except:
            pass
        raise

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_document.py <file_path> <output_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        result = process_document(file_path, output_path)
        print(json.dumps(result))
    except Exception as e:
        print(f"Error processing document: {e}")
        sys.exit(1)