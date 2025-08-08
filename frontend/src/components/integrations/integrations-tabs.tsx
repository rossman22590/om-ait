'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PipedreamConnectionsSection } from '../agents/pipedream/pipedream-connections-section';
import { ComposioConnectionsSection } from '../agents/composio/composio-connections-section';
import { Zap, GitBranch } from 'lucide-react';

export function IntegrationsTabs() {
  const showPipedreamUI = process.env.NEXT_PUBLIC_ENABLE_PIPEDREAM_UI !== 'false';

  return (
    <div className="space-y-8">
      {showPipedreamUI && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <CardTitle>Pipedream Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <PipedreamConnectionsSection />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-purple-500" />
            <CardTitle>Composio Integrations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ComposioConnectionsSection />
        </CardContent>
      </Card>
    </div>
  );
}
