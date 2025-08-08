import React from 'react';
import Image from 'next/image';

import { ExternalLink, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePipedreamAppIcon } from '@/hooks/react-query/pipedream/use-pipedream';

// Check if Pipedream UI is enabled
const showPipedreamUI = process.env.NEXT_PUBLIC_ENABLE_PIPEDREAM_UI !== 'false';

interface PipedreamConnectButtonProps {
  url: string;
  appSlug?: string;
}

// Common app name mappings for better display
const APP_NAME_MAPPINGS: Record<string, string> = {
  'linear': 'Linear',
  'github': 'GitHub', 
  'gitlab': 'GitLab',
  'google_sheets': 'Google Sheets',
  'google_drive': 'Google Drive',
  'google_calendar': 'Google Calendar',
  'google_maps': 'Google Maps',
  'notion': 'Notion',
  'slack': 'Slack',
  'discord': 'Discord',
  'twitter': 'Twitter',
  'linkedin': 'LinkedIn',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'youtube': 'YouTube',
  'zoom': 'Zoom',
  'microsoft_teams': 'Microsoft Teams',
  'outlook': 'Outlook',
  'gmail': 'Gmail',
  'dropbox': 'Dropbox',
  'onedrive': 'OneDrive',
  'salesforce': 'Salesforce',
  'hubspot': 'HubSpot',
  'mailchimp': 'Mailchimp',
  'stripe': 'Stripe',
  'paypal': 'PayPal',
  'shopify': 'Shopify',
  'woocommerce': 'WooCommerce',
  'wordpress': 'WordPress',
  'webflow': 'Webflow',
  'airtable': 'Airtable',
  'monday': 'Monday.com',
  'asana': 'Asana',
  'trello': 'Trello',
  'jira': 'Jira',
  'confluence': 'Confluence',
  'figma': 'Figma',
  'adobe_creative': 'Adobe Creative',
  'twilio': 'Twilio',
  'sendgrid': 'SendGrid',
  'aws': 'AWS',
  'google_cloud': 'Google Cloud',
  'azure': 'Azure',
  'heroku': 'Heroku',
  'vercel': 'Vercel',
  'netlify': 'Netlify'
};

function formatAppName(appSlug: string): string {
  // Check if we have a custom mapping first
  if (APP_NAME_MAPPINGS[appSlug.toLowerCase()]) {
    return APP_NAME_MAPPINGS[appSlug.toLowerCase()];
  }
  
  // Fall back to converting snake_case to Title Case
  return appSlug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractAppSlug(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const appParam = urlObj.searchParams.get('app');
    return appParam;
  } catch {
    const match = url.match(/[&?]app=([^&]+)/);
    return match ? match[1] : null;
  }
}

export function PipedreamConnectButton({ 
  url, 
  appSlug: providedAppSlug 
}: PipedreamConnectButtonProps) {
  // Hooks must be called unconditionally; conditionally render later

  const extractedAppSlug = providedAppSlug || extractAppSlug(url);
  const appName = extractedAppSlug ? formatAppName(extractedAppSlug) : 'this app';
  const appSlugToUse = providedAppSlug || extractedAppSlug;

  const { data: iconData } = usePipedreamAppIcon(appSlugToUse || '', {
    enabled: !!appSlugToUse,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Conditionally render based on feature flag
  if (!showPipedreamUI) {
    return null;
  }

  return (
    <div className="mt-4">
      <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {iconData?.icon_url ? (
              <Image
                src={iconData.icon_url}
                alt={`${appName} icon`}
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium">Connect to {appName}</h4>
              <p className="text-sm text-muted-foreground">
                Authorize {appName} to enable this integration
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleClick}
            >
              Connect
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}