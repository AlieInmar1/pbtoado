import { ClientOCRService } from './ClientOCRService';

export interface OCRResult {
  storyId: string;
  title: string;
  currentRank: number;
  previousRank: number | null;
}

export class OCRService {
  /**
   * Process a screenshot through client-side OCR and server validation
   */
  static async processScreenshot(file: File, workspaceId: string): Promise<OCRResult[]> {
    try {
      // Step 1: Process the image locally using Tesseract.js
      const { extractedText, storyIds } = await ClientOCRService.processImage(file);
      
      // Step 2: Send the extracted data to the server for validation
      return await ClientOCRService.validateWithServer(
        file,
        extractedText,
        storyIds,
        workspaceId
      );
    } catch (error) {
      console.error('Error in OCR processing:', error);
      
      // Fallback to server-side processing if client-side fails
      return await OCRService.fallbackToServerProcessing(file, workspaceId);
    }
  }
  
  /**
   * Fallback to server-side processing if client-side OCR fails
   */
  private static async fallbackToServerProcessing(file: File, workspaceId: string): Promise<OCRResult[]> {
    console.log('Falling back to server-side processing');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', workspaceId);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-ranking-screenshot`,
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
      throw new Error(error.error || 'Failed to process screenshot');
    }
    
    const data = await response.json();
    return data.results;
  }
  
  /**
   * Create update data for saving rankings
   */
  static createUpdateData(result: OCRResult) {
    return {
      current_rank: result.currentRank,
      previous_rank: result.previousRank === null ? undefined : result.previousRank,
      rank_changed_at: new Date().toISOString()
    };
  }
}
