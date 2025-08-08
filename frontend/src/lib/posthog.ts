// Lightweight no-op PostHog wrapper so the app can run without posthog-js
// Replace imports of 'posthog-js' with '@/lib/posthog'

type AnyFn = (...args: any[]) => void;
const noop: AnyFn = () => {};

const posthog = {
  init: noop,
  capture: noop,
  identify: noop,
  reset: noop,
  opt_in_capturing: noop,
  opt_out_capturing: noop,
  group: noop,
  setPersonProperties: noop,
  setPersonPropertiesForFlags: noop,
  onFeatureFlags: noop,
} as const;

export default posthog;
