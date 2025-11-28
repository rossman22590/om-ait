import { useState, useCallback } from 'react';
import { ProjectLimitError, BillingError } from '@/lib/api/errors';

interface UseBillingModalReturn {
  showModal: boolean;
  creditsExhausted: boolean;
  openModal: (error?: BillingError | ProjectLimitError) => void;
  closeModal: () => void;
}

/**
 * Unified hook for handling billing modals consistently across the app.
 * Determines if credits are exhausted based on the error type and message.
 */
export function useBillingModal(): UseBillingModalReturn {
  const [showModal, setShowModal] = useState(false);
  const [creditsExhausted, setCreditsExhausted] = useState(false);

  const openModal = useCallback((error?: BillingError | ProjectLimitError) => {
    // BillingError means credits exhausted, ProjectLimitError means project limit
    const isCreditsExhausted = error instanceof BillingError;
    setCreditsExhausted(isCreditsExhausted);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    // Reset credits exhausted state when closing
    setCreditsExhausted(false);
  }, []);

  return {
    showModal,
    creditsExhausted,
    openModal,
    closeModal,
  };
}
