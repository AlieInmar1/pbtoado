// Utility function to manually update form fields
function updateStoryFields(title, description, acceptanceCriteria) {
  // Update title field
  const titleInput = document.getElementById('title');
  if (titleInput) {
    titleInput.value = title;
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Update description field
  const descriptionInput = document.getElementById('description');
  if (descriptionInput) {
    descriptionInput.value = description;
    descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Update acceptance criteria if provided
  if (acceptanceCriteria && acceptanceCriteria.length > 0) {
    // This part depends on how acceptance criteria are stored in the form
    // You may need to adjust this based on your form structure
    console.log('Acceptance criteria:', acceptanceCriteria);
  }
  
  console.log('Form fields updated manually');
}

// Example usage:
// updateStoryFields('Implement User Login', 'As a user, I want to log in to the system', ['Given valid credentials, when I submit the form, then I should be logged in']);

