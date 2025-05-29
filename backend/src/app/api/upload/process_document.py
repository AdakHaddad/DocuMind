import sys
import json
import os
import time
import datetime
import logging
import traceback
import warnings
from pathlib import Path
from typing import Dict, Any, List
from importlib import reload
from langchain_docling import DoclingLoader
from langchain_core.documents import Document
import psutil
from queue import Queue
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import functools
import gc

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("document_processing.log"),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger(__name__)

# Create processed directory if it doesn't exist
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Development mode check
IS_DEV = os.getenv('NODE_ENV') == 'development'

# Production configuration
MAX_WORKERS = min(32, (os.cpu_count() or 1) * 4)  # Optimize thread count
CHUNK_SIZE = 1024 * 1024  # 1MB chunks for file operations
BATCH_SIZE = 5  # Number of pages to process in parallel

def memoize(func):
    """Simple memoization decorator for document processing functions"""
    cache = {}
    
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        key = str(args) + str(kwargs)
        if key not in cache:
            cache[key] = func(*args, **kwargs)
        return cache[key]
    
    return wrapper

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

class LangChainDocumentProcessor:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
        self.processing_queue = Queue()
        
    def process_document_chunk(self, chunk: Document) -> str:
        """Process a single document chunk"""
        try:
            return chunk.page_content.strip()
        finally:
            # Force garbage collection after processing each chunk
            gc.collect()

    def _process_single_document(self, file_path: str, output_path: str, callback: callable):
        """Process a single document using LangChain DoclingLoader with optimizations"""
        stopwatch = Stopwatch().start()
        try:
            logger.info(f"Processing document: {os.path.basename(file_path)}")
            
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Input file not found: {file_path}")
            
            # Create DoclingLoader instance and suppress numpy warnings
            with warnings.catch_warnings():
                warnings.filterwarnings('ignore', category=RuntimeWarning)
                
                loader = DoclingLoader(file_path=file_path)
                documents: List[Document] = loader.load()
            
            if not documents:
                raise ValueError("No content extracted from document")
            
            # Process documents in parallel batches
            markdown_content = ""
            for i in range(0, len(documents), BATCH_SIZE):
                batch = documents[i:i + BATCH_SIZE]
                futures = [self.executor.submit(self.process_document_chunk, doc) for doc in batch]
                
                for future in as_completed(futures):
                    content = future.result()
                    if content:
                        markdown_content += content
                        markdown_content += "\n\n---\n\n"
            
            # Remove the last separator
            markdown_content = markdown_content.rstrip("\n\n---\n\n")
            
            if not markdown_content.strip():
                raise ValueError("No text content extracted from document")
            
            # Create output with just the text content
            doc_json = {
                "success": True,
                "data": {
                    "text": markdown_content.strip(),
                    "metadata": {
                        "filename": os.path.basename(file_path),
                        "processed_at": str(datetime.datetime.now()),
                        "processing_time": stopwatch.get_formatted_time(),
                        "status": "completed"
                    }
                }
            }
            
            # Save output efficiently
            output_dir = os.path.dirname(output_path)
            os.makedirs(output_dir, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8', buffering=CHUNK_SIZE) as f:
                json.dump(doc_json, f, ensure_ascii=False)
            
            # Print result to stdout for the Node.js process
            print(json.dumps(doc_json))
            sys.stdout.flush()
            
            # Call callback with success
            callback(True, doc_json)
            
        except Exception as e:
            stopwatch.stop()
            error_msg = f"Error processing document with LangChain: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            
            # Create error response
            error_json = {
                "success": False,
                "error": error_msg,
                "metadata": {
                    "filename": os.path.basename(file_path),
                    "processed_at": str(datetime.datetime.now()),
                    "processing_time": stopwatch.get_formatted_time(),
                    "status": "error",
                    "traceback": traceback.format_exc()
                }
            }
            
            try:
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(error_json, f, ensure_ascii=False)
            except Exception as save_error:
                logger.error(f"Failed to save error state: {save_error}")
            
            print(json.dumps(error_json))
            sys.stdout.flush()
            callback(False, error_json)
        finally:
            # Cleanup
            gc.collect()

    def process_document(self, file_path: str, output_path: str, callback: callable):
        """Add document to processing queue"""
        self.processing_queue.put((file_path, output_path, callback))
        self._process_single_document(file_path, output_path, callback)

# Initialize processor
processor = LangChainDocumentProcessor()

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        error_json = {
            "success": False,
            "error": "Usage: python process_document.py <file_path> [output_path]"
        }
        print(json.dumps(error_json))
        sys.exit(1)
    
    file_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) >= 3 else os.path.join(
        PROCESSED_DIR, 
        f"{os.path.splitext(os.path.basename(file_path))[0]}_processed.json"
    )
    
    def process_callback(success, result):
        if not success:
            sys.exit(1)
    
    try:
        processor.process_document(file_path, output_path, process_callback)
    except Exception as e:
        error_json = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_json))
        sys.exit(1)

if __name__ == "__main__":
    main()