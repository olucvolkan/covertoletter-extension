/**
 * Job Description Parser Utility
 * 
 * This utility helps detect and extract job descriptions from various job posting sites.
 * It provides a set of common selectors and parsing strategies for popular job sites.
 */

class JobDescriptionParser {
  constructor() {
    // Common selectors for popular job sites
    this.selectors = {
      linkedin: [
        '.description__text',
        '.show-more-less-html__markup'
      ],
      indeed: [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText'
      ],
      glassdoor: [
        '.jobDescriptionContent',
        '.desc',
        '[data-test="jobDescriptionContent"]'
      ],
      monster: [
        '.job-description'
      ],
      zipRecruiter: [
        '.job_description'
      ],
      // Generic fallbacks
      generic: [
        '[data-testid="job-description"]',
        '[data-automation="jobDescription"]',
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '.description',
        '.job-details'
      ]
    };
    
    // Keywords that might indicate job description sections
    this.keywords = [
      'job description',
      'about the job',
      'description',
      'responsibilities',
      'requirements',
      'what you\'ll do',
      'what we\'re looking for'
    ];
  }
  
  /**
   * Parse job description from a given document
   * @param {Document} document - The document to parse
   * @returns {string|null} - The extracted job description or null if none found
   */
  parse(document) {
    // Try to find job description using selectors
    const descriptionFromSelectors = this.parseUsingSelectors(document);
    if (descriptionFromSelectors) {
      return descriptionFromSelectors;
    }
    
    // Try to find job description using headings
    return this.parseUsingHeadings(document);
  }
  
  /**
   * Parse job description using predefined selectors
   * @param {Document} document - The document to parse
   * @returns {string|null} - The extracted job description or null if none found
   */
  parseUsingSelectors(document) {
    // Flatten all selectors into a single array
    const allSelectors = Object.values(this.selectors).flat();
    
    // Try each selector
    for (const selector of allSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          // Combine text from all matching elements
          let text = '';
          elements.forEach(el => {
            text += el.textContent + '\n';
          });
          return this.cleanText(text);
        }
      } catch (e) {
        // Ignore errors with individual selectors
        console.debug(`Error with selector ${selector}:`, e);
      }
    }
    
    return null;
  }
  
  /**
   * Parse job description by looking for headings
   * @param {Document} document - The document to parse
   * @returns {string|null} - The extracted job description or null if none found
   */
  parseUsingHeadings(document) {
    try {
      // Find headings that might indicate job description sections
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
      
      for (const heading of headings) {
        const headingText = heading.textContent.toLowerCase();
        
        // Check if heading contains any of our keywords
        if (this.keywords.some(keyword => headingText.includes(keyword))) {
          // Get the parent element and its next sibling or children
          const parent = heading.parentElement;
          const nextSibling = heading.nextElementSibling;
          
          // Strategy 1: Get the next sibling
          if (nextSibling) {
            return this.cleanText(nextSibling.textContent);
          }
          
          // Strategy 2: Get the parent's next sibling
          if (parent.nextElementSibling) {
            return this.cleanText(parent.nextElementSibling.textContent);
          }
          
          // Strategy 3: Get all text after the heading within the parent
          if (parent.children.length > 1) {
            let text = '';
            let found = false;
            for (const child of parent.children) {
              if (found) {
                text += child.textContent + '\n';
              } else if (child === heading) {
                found = true;
              }
            }
            if (text) {
              return this.cleanText(text);
            }
          }
        }
      }
    } catch (e) {
      console.debug('Error parsing using headings:', e);
    }
    
    return null;
  }
  
  /**
   * Clean and format the extracted text
   * @param {string} text - The text to clean
   * @returns {string} - The cleaned text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .trim()
      // Replace multiple spaces with a single space
      .replace(/\s+/g, ' ')
      // Replace multiple newlines with a single newline
      .replace(/\n+/g, '\n')
      // Remove any HTML tags that might be left
      .replace(/<[^>]*>/g, '')
      // Trim again to be safe
      .trim();
  }
}

// Export the parser
if (typeof module !== 'undefined') {
  module.exports = JobDescriptionParser;
}