import { getJson, getPage } from '../lib/requests.ts';

const PUBLIC_PAGES = ['/login', '/register', '/forgot-password'];

export function publicScenario() {
  getJson('/api/health');
  getJson('/api/config/turnstile');
  for (const path of PUBLIC_PAGES) getPage(path);
}
