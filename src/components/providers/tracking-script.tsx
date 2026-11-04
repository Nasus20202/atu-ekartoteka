export const TRACKING_SCRIPT_SRC = '/api/tracking';

/**
 * Loads the operator's analytics snippet from `/api/tracking`, which reads
 * TRACKING_SCRIPT at request time. Static pages stay static, and the script
 * loads in parallel with the HTML. An unset variable serves an empty script.
 */
export function TrackingScript() {
  return <script src={TRACKING_SCRIPT_SRC} defer />;
}
