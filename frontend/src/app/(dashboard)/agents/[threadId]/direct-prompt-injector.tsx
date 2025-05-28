'use client';

import { useEffect } from 'react';

// This simple component injects the custom prompt directly into the API call
export default function DirectPromptInjector() {
  useEffect(() => {
    // Add the custom prompt to window object so it's globally accessible
    const originalFetch = window.fetch;
    
    // Override fetch to inject custom prompt
    window.fetch = async function(...args) {
      // Only intercept agent-run API calls
      if (args[0] && typeof args[0] === 'string' && args[0].includes('/api/agent-run')) {
        const customPrompt = localStorage.getItem('user_custom_prompt');
        
        if (customPrompt && args[1] && args[1].body) {
          try {
            // Parse the request body
            const body = JSON.parse(args[1].body.toString());
            
            // Add the custom prompt to the options
            if (body.options) {
              body.options.custom_prompt = customPrompt;
              console.log('Injecting custom prompt into agent run:', customPrompt.slice(0, 50) + '...');
            } else {
              body.options = { custom_prompt: customPrompt };
              console.log('Creating options with custom prompt for agent run:', customPrompt.slice(0, 50) + '...');
            }
            
            // Update the request with the modified body
            args[1].body = JSON.stringify(body);
          } catch (e) {
            console.error('Error injecting custom prompt:', e);
          }
        }
      }
      
      // Call the original fetch with modified arguments
      return originalFetch.apply(this, args);
    };
    
    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
