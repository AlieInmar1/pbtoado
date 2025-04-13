import { createWorker } from 'tesseract.js';
import { OCRResult } from './OCRService';

// Regular expression to match ProductBoard IDs (e.g., PB-123)
const STORY_ID_REGEX = /([A-Z]+-\d+)/;

export class ClientOCRService {
  /**
   * Process an image locally using Tesseract.js
   */
  static async processImage(file: File): Promise<{
    extractedText: string;
    storyIds: Array<{ id: string; title: string; position: number }>;
  }> {
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    try {
      // Recognize text in the image
      const { data } = await worker.recognize(file);
      const extractedText = data.text;
      
      console.log('Extracted text:', extractedText);
      
      // Extract story IDs, titles, and their positions
      const storyIds = this.extractStoryIds(extractedText);
      
      return { extractedText, storyIds };
    } finally {
      // Always terminate the worker when done
      await worker.terminate();
    }
  }
  
  /**
   * Extract story IDs, titles, and their positions from text
   */
  static extractStoryIds(text: string): Array<{ id: string; title: string; position: number }> {
    const lines = text.split('\n');
    const results: Array<{ id: string; title: string; position: number }> = [];
    
    lines.forEach((line, index) => {
      const idMatch = line.match(STORY_ID_REGEX);
      if (idMatch) {
        // Extract the ID
        const id = idMatch[0];
        
        // Extract the title (text after the ID)
        const idIndex = line.indexOf(id);
        const title = line.substring(idIndex + id.length).trim();
        
        results.push({
          id,
          title,
          position: index, // Use line number as position
        });
      }
    });
    
    return results;
  }
  
  /**
   * Send extracted data to server for validation and processing
   */
  static async validateWithServer(
    file: File,
    extractedText: string,
    storyIds: Array<{ id: string; title: string; position: number }>,
    workspaceId: string
  ): Promise<OCRResult[]> {
    // Create a form with the extracted data and the original file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extracted_text', extractedText);
    formData.append('story_ids', JSON.stringify(storyIds));
    formData.append('workspace_id', workspaceId);
    
    // Send to server for validation
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-screenshot`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to validate screenshot');
    }
    
    const data = await response.json();
    return data.results;
  }
}
