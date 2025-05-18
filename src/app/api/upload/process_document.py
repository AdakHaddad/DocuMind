import sys
import json
import os
import time
import datetime
import logging
import traceback
from pathlib import Path
from typing import Dict, Any
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    AcceleratorDevice,
    AcceleratorOptions,
    PdfPipelineOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create processed directory if it doesn't exist
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

class Stopwatch:
    def __init__(self):
        self.start_time = None
        self.end_time = None
    
    def start(self):
        self.start_time = time.time()
        return self
    
    def stop(self):
        self.end_time = time.time()
        return self
    
    def get_elapsed_time(self):
        if self.start_time is None:
            return 0
        if self.end_time is None:
            return time.time() - self.start_time
        return self.end_time - self.start_time
    
    def get_formatted_time(self):
        elapsed = self.get_elapsed_time()
        minutes = int(elapsed // 60)
        seconds = elapsed % 60
        return f"{minutes}m {seconds:.2f}s"

def process_document(file_path: str, output_path: str) -> Dict[str, Any]:
    """
    Process a document using Docling with optimized pipeline options
    
    Args:
        file_path (str): Path to the uploaded document
        output_path (str): Path to save the processed output
        
    Returns:
        Dict: Result dictionary with document data
    """
    stopwatch = Stopwatch().start()
    try:
        logger.info(f"Starting document processing: {os.path.basename(file_path)}")
        logger.info(f"File exists: {os.path.exists(file_path)}")
        logger.info(f"File size: {os.path.getsize(file_path)} bytes")
        
        # Configure pipeline options
        logger.info("Configuring pipeline options...")
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True
        pipeline_options.do_table_structure = True
        pipeline_options.table_structure_options.do_cell_matching = True
        pipeline_options.ocr_options.lang = ["en"]  # Set to English
        pipeline_options.accelerator_options = AcceleratorOptions(
            num_threads=4,  # Use 4 threads for processing
            device=AcceleratorDevice.CPU  # Force CPU usage
        )

        # Create converter with pipeline options
        logger.info("Creating document converter...")
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        
        # Convert the document
        logger.info("Converting document...")
        result = converter.convert(file_path)
        
        # Export to markdown format
        logger.info("Exporting to markdown...")
        markdown_content = result.document.export_to_markdown()
        
        # Stop the stopwatch
        stopwatch.stop()
        processing_time = stopwatch.get_formatted_time()
        
        # Create final document with metadata
        logger.info("Creating output JSON...")
        doc_json = {
            "content": markdown_content,
            "metadata": {
                "filename": os.path.basename(file_path),
                "processed_at": str(datetime.datetime.now()),
                "processing_time": processing_time,
                "processing_seconds": stopwatch.get_elapsed_time(),
                "pipeline_options": {
                    "ocr_enabled": pipeline_options.do_ocr,
                    "table_structure_enabled": pipeline_options.do_table_structure,
                    "num_threads": pipeline_options.accelerator_options.num_threads,
                    "device": "CPU"
                }
            }
        }
        
        # Save with buffered writing
        logger.info(f"Saving processed document to {output_path}...")
        with open(output_path, 'w', encoding='utf-8', buffering=1024*1024) as f:
            json.dump(doc_json, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Successfully processed document in {processing_time}")
        return doc_json
        
    except Exception as e:
        stopwatch.stop()
        error_msg = f"Error processing document: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        print(error_msg)  # Print to stdout for the API to capture
        # Clean up any temporary files
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception as cleanup_error:
            logger.error(f"Error during cleanup: {cleanup_error}")
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
        print(f"Error processing document: {str(e)}\n{traceback.format_exc()}")
        sys.exit(1)