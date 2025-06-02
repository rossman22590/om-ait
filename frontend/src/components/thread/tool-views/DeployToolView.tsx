import React from 'react';
import { ToolViewProps } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Helper function to extract JSON from tool content string
function extractJsonFromToolContent(content: string): any | null {
  try {
    // Try to find JSON in the string using regex
    const jsonPattern = /\{[\s\S]*\}/;
    const match = content.match(jsonPattern);
    
    if (match && match[0]) {
      // Try parsing as regular JSON first
      try {
        return JSON.parse(match[0]);
      } catch (e) {
        // If standard JSON parsing fails, try handling Python-style dictionary
        let pythonToJson = match[0]
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":') // Add quotes around keys
          .replace(/None/g, 'null') // Replace Python None with null
          .replace(/True/g, 'true') // Replace Python True with true
          .replace(/False/g, 'false'); // Replace Python False with false
        
        // Additional fixes for Python syntax:
        pythonToJson = pythonToJson
          .replace(/,\s*}/g, '}') // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
          .replace(/NaN/g, 'null') // Replace NaN with null
          .replace(/Infinity/g, 'null') // Replace Infinity with null
          .replace(/\(/g, '[').replace(/\)/g, ']'); // Convert tuples to arrays
        
        try {
          return JSON.parse(pythonToJson);
        } catch (innerError) {
          console.error('Failed to parse Python dict:', innerError);
          // If still failing, try a more aggressive approach
          pythonToJson = pythonToJson
            // Handle keys with hyphens or other special characters
            .replace(/"([^"]+)":\s*"([^"]*)"/g, '"$1":"$2"') 
            // Fix any unquoted string values
            .replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)/g, ':"$1"')
            // Fix keys with spaces
            .replace(/"([^"]+)\s+([^"]+)":/g, '"$1_$2":');
          
          return JSON.parse(pythonToJson);
        }
      }
    }
  } catch (e) {
    console.error('Error extracting JSON from content:', e);
  }
  return null;
}

export function DeployToolView({ toolContent, isSuccess: propIsSuccess }: ToolViewProps) {
  console.log('Raw toolContent:', toolContent); // Log raw content for debugging
  
  // Handle different response formats
  let parsedContent: any = {};
  
  if (typeof toolContent === 'string') {
    console.log('Parsing string content:', toolContent);
    
    // Check if the content is wrapped in a role/content structure
    try {
      const jsonObj = JSON.parse(toolContent);
      if (jsonObj && jsonObj.role === 'user' && jsonObj.content) {
        console.log('Found content wrapped in role/content structure');
        toolContent = jsonObj.content; // Extract the actual content
      }
    } catch (e) {
      // Not JSON or not the expected structure, continue with normal parsing
      console.log('Content is not wrapped in JSON role/content structure');
    }
    
    // Now try to check if this is a ToolResult format
    const toolResultPattern = /ToolResult\(success=(True|False), output=({[\s\S]*})\)/;
    const match = toolContent.match(toolResultPattern);
    
    if (match) {
      console.log('ToolResult match found, groups:', match.length, 'Success value:', match[1], 'Output content length:', match[2]?.length);  
    } else {
      console.log('No ToolResult match found in content');  
    }
    
    if (match && match[2]) {
      // Found ToolResult format, extract the output JSON
      const isSuccess = match[1] === 'True';
      try {
        // Process the Python-style dictionary to a proper JSON string
        // This is a critical part - we need to properly handle nested JSON objects like urls:{cloudflare:X,custom_domain:Y}
        let jsonStr = match[2]
          // First replace all single quotes with double quotes
          .replace(/'/g, '"')
          // Fix all keys (words followed by colon) to have double quotes - match non-whitespace characters before colon
          .replace(/([\w\-]+)\s*:/g, '"$1":')
          // Handle special Python values
          .replace(/None/g, 'null')
          .replace(/True/g, 'true')
          .replace(/False/g, 'false');
        
        // Safe cleanup for potentially malformed JSON
        jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
        
        console.log('Raw jsonStr after replacement:', jsonStr);
        console.log('Processed JSON string:', jsonStr);
        
        // Safer parsing with fallback
        let outputJson;
        try {
          outputJson = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('Initial JSON parsing failed:', parseError);
          // Try a more aggressive cleanup as fallback
          try {
            // Remove any trailing commas
            const cleanedStr = jsonStr.replace(/,(?=\s*[}\]])/g, '');
            outputJson = JSON.parse(cleanedStr);
            console.log('Parsed with fallback cleanup');
          } catch (fallbackError) {
            // If all parsing fails, create a minimal valid object
            console.error('Fallback parsing also failed:', fallbackError);
            outputJson = { error: 'Could not parse deployment result' };
          }
        }
        parsedContent = {
          ...outputJson,
          success: isSuccess
        };
        console.log('Parsed ToolResult content:', parsedContent);
      } catch (e) {
        console.error('Error parsing ToolResult output JSON:', e);
        parsedContent = { 
          message: 'Error parsing deployment result',
          error: `ToolResult parsing error: ${e.message}`,
          rawOutput: match[2]
        };
      }
    } else {
      // Try direct JSON extraction
      try {
        const jsonContent = extractJsonFromToolContent(toolContent);
        if (jsonContent) {
          parsedContent = jsonContent;
          console.log('Found and parsed JSON directly in content:', parsedContent);
        } else {
          // Not JSON, try direct JSON parsing of the whole string
          try {
            const jsonParsed = JSON.parse(toolContent);
            parsedContent = jsonParsed;
            console.log('Parsed direct JSON content:', parsedContent);
          } catch (e) {
            console.log('Content is not valid JSON:', e);
            // Not JSON, use as plain text
            parsedContent = { 
              message: toolContent,
              isText: true
            };
          }
        }
      } catch (e) {
        console.error('Error in JSON extraction fallback:', e);
        parsedContent = { 
          message: 'Unable to parse deployment data',
          error: e.message,
        };
      }
    }
  } else if (toolContent && typeof toolContent === 'object') {
    // Already an object
    parsedContent = toolContent;
  }

  // Check if deployment was successful
  // Use the prop value if available, otherwise check the parsed content
  const isSuccess = propIsSuccess !== undefined ? propIsSuccess : parsedContent?.success !== false;

  // Extract URLs if available - handle all possible formats with better nested property access
  // First look for nested urls object which is the most common format
  let cloudflareUrl = '';
  let customDomainUrl = '';
  
  console.log('Looking for URLs in parsedContent:', parsedContent);
  
  // Check all possible locations where URLs might be stored
  if (parsedContent?.urls) {
    // Top-level urls object format
    cloudflareUrl = parsedContent.urls.cloudflare || '';
    customDomainUrl = parsedContent.urls.custom_domain || '';
    console.log('Found URLs in top-level urls object:', { cloudflareUrl, customDomainUrl });
  } else if (parsedContent?.output?.urls) {
    // Nested urls inside output object (common in ToolResult)
    cloudflareUrl = parsedContent.output.urls.cloudflare || '';
    customDomainUrl = parsedContent.output.urls.custom_domain || '';
    console.log('Found URLs in nested output.urls object:', { cloudflareUrl, customDomainUrl });
  } else if (parsedContent?.url) {
    // Direct url property
    cloudflareUrl = parsedContent.url;
    console.log('Found direct URL property:', cloudflareUrl);
  } else if (parsedContent?.output?.url) {
    // Direct url property inside output
    cloudflareUrl = parsedContent.output.url;
    console.log('Found direct URL property inside output:', cloudflareUrl);
  }
  
  // For ToolResult containing raw output string with URLs
  const outputStr = parsedContent?.output || '';
  if ((!cloudflareUrl || cloudflareUrl.length === 0) && typeof outputStr === 'string') {
    // Try to extract from output string if we couldn't find it elsewhere
    const urlMatch = outputStr.match(/https?:\/\/[\w.-]+\.pages\.dev/);
    if (urlMatch) {
      console.log('Extracted Cloudflare URL from output string:', urlMatch[0]);
      cloudflareUrl = urlMatch[0];
    }
    
    // Try to extract custom domain if present
    const customDomainMatch = outputStr.match(/https?:\/\/[\w.-]+\.mymachine\.space/);
    if (customDomainMatch && (!customDomainUrl || customDomainUrl.length === 0)) {
      console.log('Extracted custom domain from output string:', customDomainMatch[0]);
      customDomainUrl = customDomainMatch[0];
    }
  }
  
  // Extract message and error details - check both top level and nested in output
  const message = parsedContent?.message || parsedContent?.output?.message || '';
  const errorMessage = parsedContent?.error || parsedContent?.output?.error || '';
  const customDomainStatus = parsedContent?.custom_domain_status || parsedContent?.output?.custom_domain_status || '';
  

  
  // Get raw output for debugging
  const rawOutput = typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent, null, 2);

  // Function to try extracting URLs directly from the raw output if parsing failed
  const extractUrlsFromRawString = (str: string) => {
    // Try to extract deployment URLs directly from the string
    let extractedCloudflareUrl = '';
    let extractedCustomDomainUrl = '';
    
    // Match cloudflare URLs
    const cloudflareMatch = str.match(/https?:\/\/[\w.-]+\.pages\.dev/g);
    if (cloudflareMatch && cloudflareMatch.length > 0) {
      extractedCloudflareUrl = cloudflareMatch[0];
      console.log('Extracted Cloudflare URL from raw string:', extractedCloudflareUrl);
    }
    
    // Match custom domain URLs
    const customDomainMatch = str.match(/https?:\/\/[\w.-]+\.mymachine\.space/g);
    if (customDomainMatch && customDomainMatch.length > 0) {
      extractedCustomDomainUrl = customDomainMatch[0];
      console.log('Extracted custom domain from raw string:', extractedCustomDomainUrl);
    }
    
    return { cloudflare: extractedCloudflareUrl, customDomain: extractedCustomDomainUrl };
  };
  
  // Try to get URLs from all possible locations
  const extractedUrls = extractUrlsFromRawString(rawOutput);
  
  // Use extracted URLs if we didn't find them through parsing
  if (!cloudflareUrl && extractedUrls.cloudflare) {
    cloudflareUrl = extractedUrls.cloudflare;
  }
  
  if (!customDomainUrl && extractedUrls.customDomain) {
    customDomainUrl = extractedUrls.customDomain;
  }
  
  console.log('Final URLs to display:', { cloudflareUrl, customDomainUrl });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={isSuccess ? "bg-green-500" : "bg-red-500"}>
              {isSuccess ? "Deployment Successful" : "Deployment Failed"}
            </Badge>
          </div>

          {/* Message */}
          <div className="text-sm">
            {message}
          </div>

          {/* Error Details */}
          {!isSuccess && errorMessage && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm text-red-700">Error Details:</h3>
                  <p className="text-sm text-red-600 whitespace-pre-wrap">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* URLs Section - MOVED UP for better visibility */}
          {isSuccess && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
              <h3 className="font-medium text-sm">Deployment URLs:</h3>
              
              {cloudflareUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-blue-50">Cloudflare</Badge>
                  <Link href={cloudflareUrl} target="_blank" rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline flex items-center gap-1">
                    {cloudflareUrl} <ExternalLink size={12} />
                  </Link>
                </div>
              )}
              
              {customDomainUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-green-50">Custom Domain</Badge>
                  <Link href={customDomainUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1">
                    {customDomainUrl} <ExternalLink size={12} />
                  </Link>
                </div>
              )}
              
              {customDomainStatus && (
                <div className="text-sm mt-1 text-green-600">
                  {customDomainStatus}
                </div>
              )}
              
              {!cloudflareUrl && !customDomainUrl && (
                <div className="text-sm text-gray-500">No deployment URLs found</div>
              )}
            </div>
          )}
          
          {/* Raw Response for Debugging */}
          <div className="mt-2">
            <details className="text-xs" open>
              <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-700">Show Raw Output</summary>
              <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-60 text-gray-700">
                {rawOutput}
              </pre>
              
              {/* Always show the parsed content for debugging */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <h4 className="font-medium text-gray-600 mb-1">Parsed Content:</h4>
                <pre className="p-2 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-40 text-gray-700">
                  {JSON.stringify(parsedContent, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
