/**
 * ProductBoard Token Capture Bookmarklet
 * 
 * This script is converted to a bookmarklet URL that users can drag to their bookmarks bar.
 * When clicked while on ProductBoard, it extracts authentication tokens and sends them
 * back to the token capture page.
 */

// This function is converted to a bookmarklet
export function getBookmarkletCode() {
  // Core implementation as a plain function
  const extractAndSendData = () => {
    try {
      // Show feedback to the user
      const feedbackDiv = document.createElement('div');
      feedbackDiv.style.position = 'fixed';
      feedbackDiv.style.top = '10px';
      feedbackDiv.style.left = '50%';
      feedbackDiv.style.transform = 'translateX(-50%)';
      feedbackDiv.style.padding = '10px 20px';
      feedbackDiv.style.background = '#4CAF50';
      feedbackDiv.style.color = 'white';
      feedbackDiv.style.borderRadius = '4px';
      feedbackDiv.style.zIndex = '9999';
      feedbackDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      feedbackDiv.innerText = 'Extracting ProductBoard tokens...';
      document.body.appendChild(feedbackDiv);
      
      // Gather cookies
      const cookies = document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0);
      
      // Gather localStorage
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) storage[key] = localStorage.getItem(key);
      }
      
      // Find user info if available
      let userId = null;
      let userEmail = null;
      
      // Look for user info in localStorage
      for (const key in storage) {
        if (key.includes('user') || key.includes('account')) {
          try {
            const data = JSON.parse(storage[key]);
            if (data && data.id && !userId) userId = data.id;
            if (data && data.email && !userEmail) userEmail = data.email;
            if (data && data.user) {
              if (data.user.id && !userId) userId = data.user.id;
              if (data.user.email && !userEmail) userEmail = data.user.email;
            }
          } catch(e) {
            // Ignore JSON parse errors
          }
        }
      }
      
      // Also try to extract from meta tags or data attributes
      if (!userId || !userEmail) {
        const userElements = document.querySelectorAll('[data-user-id], [data-user-email], [data-current-user]');
        userElements.forEach(el => {
          const dataset = el.dataset;
          if (dataset.userId && !userId) userId = dataset.userId;
          if (dataset.userEmail && !userEmail) userEmail = dataset.userEmail;
          if (dataset.currentUser) {
            try {
              const user = JSON.parse(dataset.currentUser);
              if (user.id && !userId) userId = user.id;
              if (user.email && !userEmail) userEmail = user.email;
            } catch(e) {
              // Ignore JSON parse errors
            }
          }
        });
      }
      
      // Send message back to token capture page
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'CAPTURE_COMPLETE',
          cookies,
          localStorage: storage,
          userId,
          userEmail
        }, '*');
        
        // Update feedback message
        feedbackDiv.style.background = '#2196F3';
        feedbackDiv.innerText = 'Tokens captured successfully! You can close this window.';
        
        // Auto remove feedback after 5 seconds
        setTimeout(() => {
          if (feedbackDiv.parentNode) {
            feedbackDiv.parentNode.removeChild(feedbackDiv);
          }
        }, 5000);
      } else {
        // Update feedback message for error
        feedbackDiv.style.background = '#F44336';
        feedbackDiv.innerText = 'Error: Cannot communicate with the token capture window. Please keep both windows open.';
        
        // Auto remove feedback after 5 seconds
        setTimeout(() => {
          if (feedbackDiv.parentNode) {
            feedbackDiv.parentNode.removeChild(feedbackDiv);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Error capturing tokens:', error);
      alert('Error capturing tokens: ' + error.message);
    }
  };

  // Convert the function to a bookmarklet-safe string
  const fnString = extractAndSendData.toString();
  
  // Return the formatted bookmarklet code
  return `javascript:(${fnString})();`;
}

/**
 * For manual copy-paste in the console
 */
export const consoleScript = `
const cookies = document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0);
const storage = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) storage[key] = localStorage.getItem(key);
}

// Find user info if available
let userId = null;
let userEmail = null;

// Look for user info in localStorage
for (const key in storage) {
  if (key.includes('user') || key.includes('account')) {
    try {
      const data = JSON.parse(storage[key]);
      if (data && data.id && !userId) userId = data.id;
      if (data && data.email && !userEmail) userEmail = data.email;
      if (data && data.user) {
        if (data.user.id && !userId) userId = data.user.id;
        if (data.user.email && !userEmail) userEmail = data.user.email;
      }
    } catch(e) {}
  }
}

// Copy this output and paste into the form
console.log(JSON.stringify({
  cookies,
  localStorage: storage,
  userId,
  userEmail
}));
`;
