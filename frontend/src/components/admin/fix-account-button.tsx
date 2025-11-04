/**
 * Temporary admin button to fix accounts stuck without credits
 * Add this to your settings page or create a /fix-account page
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { backendApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function FixAccountButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fixAccount = async () => {
    setLoading(true);
    try {
      const response = await backendApi.post('/admin/fix/grant-free-tier-credits');
      
      if (response.data?.success) {
        toast.success('Account Fixed!', {
          description: `${response.data.message}. You now have $${response.data.credits_granted || 2.00} in credits.`,
        });
        
        // Redirect to dashboard after successful fix
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        toast.error('Fix Failed', {
          description: response.data?.message || 'Could not grant credits',
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Fix account error:', error);
      toast.error('Error', {
        description: error?.response?.data?.detail || 'Failed to fix account. Check console for details.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        Account Needs Initialization
      </h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        Your account wasn't properly initialized during signup. Click below to grant your free tier credits.
      </p>
      <Button 
        onClick={fixAccount}
        disabled={loading}
        variant="default"
        className="bg-yellow-600 hover:bg-yellow-700"
      >
        {loading ? 'Fixing Account...' : 'Grant Free Tier Credits ($2.00)'}
      </Button>
    </div>
  );
}
