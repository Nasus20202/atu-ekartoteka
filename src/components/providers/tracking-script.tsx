import Script from 'next/script';
import { connection } from 'next/server';

/**
 * Component that injects custom tracking scripts from environment variable
 * Set TRACKING_SCRIPT in your .env file with your tracking code
 */
export async function TrackingScript() {
  // Runtime env must not be frozen into the prerendered shell
  await connection();

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
