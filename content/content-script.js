// This script runs on matching web pages to detect and extract job descriptions

console.log('CvToLetter content script loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJobDescription') {
    const jobDescription = extractJobDescription();
    sendResponse({ jobDescription });
  }
  return true; // Keep the message channel open for async response
});

// Function to extract job description from the page
function extractJobDescription() {
  // Common selectors for job descriptions on popular job sites
  const selectors = [
    // LinkedIn
    '.description__text',
    '.show-more-less-html__markup',
    
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    
    // Glassdoor
    '.jobDescriptionContent',
    '.desc',
    
    // Monster
    '.job-description',
    
    // ZipRecruiter
    '.job_description',
    
    // Generic fallbacks
    '[data-testid="job-description"]',
    '[data-automation="jobDescription"]',
    '[class*="job-description"]',
    '[class*="jobDescription"]'
  ];

  // Try each selector
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        // Combine text from all matching elements
        let text = '';
        elements.forEach(el => {
          text += el.textContent + '\n';
        });
        return text.trim();
      }
    } catch (e) {
      // Ignore errors with individual selectors
    }
  }

  // Fallback: look for job description using text content
  try {
    // Find headings that might indicate job description sections
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
    for (const heading of headings) {
      if (heading.textContent.toLowerCase().includes('job description') || 
          heading.textContent.toLowerCase().includes('description') ||
          heading.textContent.toLowerCase().includes('about the job')) {
        
        // Get the parent element and its next sibling or children
        const parent = heading.parentElement;
        const nextSibling = heading.nextElementSibling;
        
        if (nextSibling) {
          return nextSibling.textContent.trim();
        } else if (parent.nextElementSibling) {
          return parent.nextElementSibling.textContent.trim();
        } else if (parent.children.length > 1) {
          // Get all text after the heading
          let text = '';
          let found = false;
          for (const child of parent.children) {
            if (found) {
              text += child.textContent + '\n';
            } else if (child === heading) {
              found = true;
            }
          }
          return text.trim();
        }
      }
    }
  } catch (e) {
    // Ignore errors in fallback method
  }

  return null;
}