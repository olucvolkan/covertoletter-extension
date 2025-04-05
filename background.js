// Handle authentication events and token management in the background

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    // First install
    console.log('Extension installed');
    // Open onboarding page
    chrome.tabs.create({
      url: 'https://cvtoletter.com/extension-welcome'
    });
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated from version ' + details.previousVersion);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle auth requests from popup
  if (message.action === 'getAuthToken') {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, token });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  // Handle logout requests from popup
  else if (message.action === 'logout') {
    chrome.identity.getAuthToken({ interactive: false }, token => {
      if (token) {
        // Revoke token
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then(() => {
            // Clear token
            chrome.identity.removeCachedAuthToken({ token }, () => {
              sendResponse({ success: true });
            });
          })
          .catch(error => {
            console.error('Error revoking token:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep the message channel open for async response
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Keep the message channel open for async response
  }
  
  // Handle job description extraction request
  else if (message.action === 'detectJobDescription') {
    // Execute script in the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // This function will be executed in the context of the page
            // We'll define it in a separate content script
            return document.body.innerText;
          }
        }, results => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else if (results && results[0]) {
            sendResponse({ success: true, text: results[0].result });
          } else {
            sendResponse({ success: false, error: 'No results' });
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Keep the message channel open for async response
  }
});

// Track when a tab is updated to a job posting site
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if the URL matches a job site
    const jobSites = [
      'linkedin.com/jobs',
      'indeed.com',
      'glassdoor.com',
      'monster.com',
      'ziprecruiter.com'
    ];
    
    // If the URL matches a job site, show the extension icon
    const isJobSite = jobSites.some(site => tab.url.includes(site));
    
    if (isJobSite) {
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: 'assets/icon-16.png',
          48: 'assets/icon-48.png',
          128: 'assets/icon-128.png'
        }
      });
    }
  }
});