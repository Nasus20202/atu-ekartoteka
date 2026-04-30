import Script from 'next/script';

/**
 * Component that injects custom tracking scripts from environment variable
 * Set TRACKING_SCRIPT in your .env file with your tracking code
 */
export function TrackingScript() {
  const trackingScript = process.env.TRACKING_SCRIPT;

  if (!trackingScript) {
    return null;
  }

  return (
    <Script
      id="custom-tracking"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: trackingScript }}
    />
  );
}
