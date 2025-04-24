/**
 * This utility script can be loaded in the browser console to help update form fields
 * when the React state updates aren't working properly.
 * 
 * Usage:
 * 1. Copy this entire file
 * 2. Open the browser console on the Story Creator page
 * 3. Paste and run this script
 * 4. Use the global updateStoryFields function to update the form fields
 */

// Global function to update form fields
window.updateStoryFields = function(title, description, acceptanceCriteria) {
  console.log('Manually updating form fields with:', { title, description, acceptanceCriteria });
  
  // Update title field
  const titleInput = document.getElementById('title');
  if (titleInput) {
    console.log('Found title input, updating to:', title);
    titleInput.value = title;
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    titleInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.error('Could not find title input element');
  }
  
  // Update description field
  const descriptionInput = document.getElementById('description');
  if (descriptionInput) {
    console.log('Found description input, updating to:', description);
    descriptionInput.value = description;
    descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    console.error('Could not find description input element');
  }
  
  // Update acceptance criteria if provided
  if (acceptanceCriteria && acceptanceCriteria.length > 0) {
    console.log('Acceptance criteria provided:', acceptanceCriteria);
    
    // This part depends on how acceptance criteria are stored in the form
    // You may need to adjust this based on your form structure
    
    // Try to find the "Add Criterion" button and click it for each criterion
    const addCriterionButton = Array.from(document.querySelectorAll('button'))
      .find(button => button.textContent.includes('Add Criterion'));
    
    if (addCriterionButton) {
      console.log('Found Add Criterion button');
      
      // First, clear existing criteria
      const removeCriterionButtons = Array.from(document.querySelectorAll('button'))
        .filter(button => button.classList.contains('text-red-500') || button.classList.contains('text-red-700'));
      
      if (removeCriterionButtons.length > 0) {
        console.log('Clearing existing criteria');
        removeCriterionButtons.forEach(button => button.click());
      }
      
      // Then add new criteria
      acceptanceCriteria.forEach((criterion, index) => {
        console.log(`Adding criterion ${index + 1}:`, criterion);
        
        // Click the Add Criterion button
        addCriterionButton.click();
        
        // Find the newly added textarea
        setTimeout(() => {
          const textareas = document.querySelectorAll('textarea');
          const criterionTextarea = textareas[textareas.length - 1];
          
          if (criterionTextarea) {
            criterionTextarea.value = criterion;
            criterionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            criterionTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 100);
      });
    } else {
      console.error('Could not find Add Criterion button');
    }
  }
  
  console.log('Form fields updated manually');
  return true;
};

// Monitor for AI responses and automatically update fields
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  
  // Clone the response so we can read it and still return the original
  const clone = response.clone();
  
  // Check if this is a call to the AI story generation function
  if (args[0] && args[0].toString().includes('analyze-story-content')) {
    try {
      const data = await clone.json();
      console.log('Intercepted AI response:', data);
      
      if (data && data.title && data.description) {
        console.log('Auto-updating form fields with AI response');
        setTimeout(() => {
          window.updateStoryFields(
            data.title,
            data.description,
            data.acceptanceCriteria || []
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error processing intercepted response:', error);
    }
  }
  
  return response;
};

console.log('Form field updater script loaded successfully!');
console.log('You can now use window.updateStoryFields(title, description, acceptanceCriteria) to manually update form fields');
