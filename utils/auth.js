// Authentication utilities for the extension

// Get the current user from local storage or API
async function getCurrentUser() {
  // First check if we have user in storage
  const { user } = await chrome.storage.local.get('user');
  
  if (user) {
    return user;
  }
  
  // If no user in storage, try to get from token
  try {
    const token = await getAuthToken();
    if (token) {
      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userInfo = await response.json();
        
        // Convert Google user format to our format
        const userData = {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          token
        };
        
        // Store user in local storage
        await chrome.storage.local.set({ user: userData });
        
        return userData;
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  
  return null;
}

// Get auth token from Chrome identity API
function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, token => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// Sign in with Google
async function signInWithGoogle() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async token => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      
      try {
        // Get user info from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userInfo = await response.json();
          
          // Convert Google user format to our format
          const userData = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            token
          };
          
          // Store user in local storage
          await chrome.storage.local.set({ user: userData });
          
          resolve(userData);
        } else {
          reject(new Error('Failed to get user info'));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Sign out
async function signOut() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, token => {
      if (token) {
        // Revoke token
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then(() => {
            // Clear token
            chrome.identity.removeCachedAuthToken({ token }, () => {
              // Clear user from storage
              chrome.storage.local.remove(['user', 'userCredits'], () => {
                resolve();
              });
            });
          })
          .catch(error => {
            reject(error);
          });
      } else {
        // No token, just clear storage
        chrome.storage.local.remove(['user', 'userCredits'], () => {
          resolve();
        });
      }
    });
  });
}