import React from 'react';
import { ToolViewProps } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function DeployToolView({ toolContent, isSuccess: propIsSuccess }: ToolViewProps) {
  console.log('Raw toolContent:', toolContent); // Log raw content for debugging
  
  // Parse the JSON content
  let parsedContent;
  try {
    parsedContent = typeof toolContent === 'string' ? JSON.parse(toolContent) : toolContent;
    console.log('Parsed content:', parsedContent); // Log parsed content for debugging
  } catch (e) {
    console.error('Error parsing tool content:', e);
    parsedContent = { 
      message: typeof toolContent === 'string' ? toolContent : 'Error parsing deployment result',
      error: `Parsing error: ${e.message}`
    };
  }

  // Check if deployment was successful
  // Use the prop value if available, otherwise check the parsed content
  const isSuccess = propIsSuccess !== undefined ? propIsSuccess : parsedContent?.success !== false;

  // Extract URLs if available - handle both old and new formats
  const deploymentUrl = parsedContent?.url || parsedContent?.urls?.cloudflare || '';
  const customDomainUrl = parsedContent?.urls?.custom_domain || '';
  
  // Extract error details if available
  const errorMessage = parsedContent?.error || '';
  
  // Get raw output for debugging
  const rawOutput = parsedContent?.output || 
    (typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent, null, 2));

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
            {parsedContent?.message}
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
          
          {/* Raw Response for Debugging */}
          <div className="mt-2">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-700">Show Raw Output</summary>
              <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-60 text-gray-700">
                {rawOutput}
              </pre>
            </details>
          </div>

          {/* URLs Section */}
          {isSuccess && (
            <div className="mt-2 space-y-2">
              <h3 className="font-medium text-sm">Deployment URLs:</h3>
              
              {deploymentUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-blue-50">Cloudflare</Badge>
                  <Link href={deploymentUrl} target="_blank" rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline flex items-center gap-1">
                    {deploymentUrl} <ExternalLink size={12} />
                  </Link>
                </div>
              )}
              
              {customDomainUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-purple-50">Custom Domain</Badge>
                  <Link href={customDomainUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1">
                    {customDomainUrl} <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Custom Domain Status */}
          {parsedContent?.custom_domain_status && (
            <div className="mt-2">
              <h3 className="font-medium text-sm">Custom Domain:</h3>
              <div className="text-sm mt-1">
                {parsedContent.custom_domain_status}
              </div>
            </div>
          )}

          {/* Error Details */}
          {!isSuccess && (
            <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">
              <h3 className="font-medium">Error Details:</h3>
              <div className="font-mono text-xs whitespace-pre-wrap mt-1">
                {parsedContent?.error || 'Error message not available'}
              </div>
              <div className="mt-2">
                <h4 className="font-medium">Raw Response:</h4>
                <div className="font-mono text-xs whitespace-pre-wrap mt-1 overflow-auto max-h-40">
                  {JSON.stringify(parsedContent, null, 2)}
                </div>
              </div>
              <div className="mt-2">
                <h4 className="font-medium">Tool Content:</h4>
                <div className="font-mono text-xs whitespace-pre-wrap mt-1 overflow-auto max-h-40">
                  {toolContent}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
