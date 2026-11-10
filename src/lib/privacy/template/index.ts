import { DATA } from '@/lib/privacy/template/data';
import { OVERVIEW } from '@/lib/privacy/template/overview';
import { RECIPIENTS } from '@/lib/privacy/template/recipients';
import { RIGHTS } from '@/lib/privacy/template/rights';
import { TECHNICAL } from '@/lib/privacy/template/technical';

/**
 * Generic starting point for the policy of any deployment. It describes only
 * what this software does; everything an operator decides is a `[[…]]`
 * placeholder that blocks saving until it is filled in or removed.
 */
export const PRIVACY_POLICY_TEMPLATE = [
  OVERVIEW,
  DATA,
  RECIPIENTS,
  RIGHTS,
  TECHNICAL,
].join('\n');
