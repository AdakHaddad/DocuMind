import sys
import json
import os
import requests
from typing import List, Dict, Any
from megaparse import parse_document
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Groq API integration
class GroqLLM:
    def __init__(self, api_key: str, model: str = "llama3-70b-8192"):
        """
        Initialize Groq LLM client
        
        Args:
            api_key (str): Groq API key
            model (str): Model name to use (default: llama3-70b-8192)
        """
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def generate(self, prompt: str) -> str:
        """
        Generate text using Groq API
        
        Args:
            prompt (str): Prompt for the LLM
            
        Returns:
            str: Generated text response
        """
        messages = [
            {"role": "system", "content": "You are a helpful assistant that generates flashcards from document content."},
            {"role": "user", "content": prompt}
        ]
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1024
        }
        
        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            raise

def process_document(file_path: str, output_path: str) -> Dict[str, Any]:
    """
    Process a document using Megaparse and generate flashcards with Groq
    
    Args:
        file_path (str): Path to the uploaded document
        output_path (str): Path to save the processed output
        
    Returns:
        Dict: Result dictionary with flashcards
    """
    # Get API key from environment variables
    groq_api_key = os.environ.get("GROQ_API_KEY")
    
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    llm = GroqLLM(api_key=groq_api_key)
    
    # For Megaparse, we need to parse the document content first
    # This can be done without LLM for the initial parsing
    document = parse_document(file_path)
    
    # Generate flashcards from the document content
    flashcards = []
    
    for section in document.sections:
        # Extract content and generate flashcards
        content = section.text
        
        # Skip empty sections
        if not content or len(content.strip()) < 50:
            continue
        
        # Example prompt to generate flashcards
        prompt = f"""
        Based on the following content, create 3-5 flashcards in question and answer format.
        Each flashcard should test an important concept from the material.
        
        Content:
        {content}
        
        Format your response as a JSON array of objects with 'question' and 'answer' fields.
        Example format:
        [
          {{"question": "What is X?", "answer": "X is Y"}},
          {{"question": "When was Z discovered?", "answer": "Z was discovered in year W"}}
        ]
        
        Only respond with the JSON array, no additional text or explanation.
        """
        
        try:
            # Generate flashcards using Groq LLM
            response = llm.generate(prompt)
            
            # Parse the response to extract flashcards
            flashcard_text = response.strip()
            
            # Remove any markdown code block formatting
            if "```json" in flashcard_text:
                flashcard_text = flashcard_text.split("```json")[1].split("```")[0].strip()
            elif "```" in flashcard_text:
                flashcard_text = flashcard_text.split("```")[1].split("```")[0].strip()
            
            # Parse the JSON response
            section_cards = json.loads(flashcard_text)
            
            # Validate each flashcard has question and answer
            valid_cards = []
            for card in section_cards:
                if "question" in card and "answer" in card:
                    valid_cards.append(card)
            
            flashcards.extend(valid_cards)
            print(f"Generated {len(valid_cards)} flashcards from section")
            
        except Exception as e:
            print(f"Error generating or parsing flashcards: {e}")
            continue
    
    # Prepare result dictionary
    result = {
        "documentName": os.path.basename(file_path),
        "totalFlashcards": len(flashcards),
        "flashcards": flashcards
    }
    
    # Save the result to output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully processed document. Generated {len(flashcards)} flashcards.")
    return result

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_document.py <file_path> <output_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        process_document(file_path, output_path)
    except Exception as e:
        print(f"Error processing document: {e}")
        sys.exit(1)