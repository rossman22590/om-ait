import { PaymentRequiredDialog } from "@/components/billing/payment-required-dialog"
import { CapabilitiesModal } from "@/components/thread/capabilities-modal"

export const ModalProviders = () => {
  return (
    <>
      <PaymentRequiredDialog />
      <CapabilitiesModal />
    </>
  )
}
