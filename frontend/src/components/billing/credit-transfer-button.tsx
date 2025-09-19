'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Gift, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreditBalance } from '@/hooks/react-query/use-billing-v2';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface CreditTransferButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function CreditTransferButton({ 
  variant = 'outline',
  size = 'default',
  className = '',
  children,
  showIcon = true
}: CreditTransferButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: balance } = useCreditBalance();
  const { session } = useAuth();

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);
    
    // Validation
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!userEmail || !userEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!balance || balance.balance < transferAmount) {
      toast.error(`Insufficient balance. You have $${balance?.balance?.toFixed(2) || '0.00'} available`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email via our API route
      const response = await fetch('/api/send-transfer-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: transferAmount,
          userEmail: userEmail,
          message: message,
          accountId: session?.user?.id || 'Unknown'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Credit transfer request sent! You requested to transfer $${transferAmount} to Machine.`);
        setShowModal(false);
        setAmount('');
        setUserEmail('');
        setMessage('');
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        toast.error('Failed to send transfer request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send transfer request. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowModal(true)}
      >
        {showIcon && <Gift className="h-4 w-4 mr-2" />}
        {children || 'Transfer Credits'}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Transfer Credits to Machine Code
            </DialogTitle>
            <DialogDescription>
              Send a credit transfer request. You'll be notified when the transfer is processed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <span className="text-blue-700 dark:text-blue-300">
                  Current Balance: ${balance?.balance?.toFixed(2) || '0.00'}
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Transfer Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to transfer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <p className="text-sm text-muted-foreground">
                We'll use this to contact you about the transfer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note about this transfer..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Transfer Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
