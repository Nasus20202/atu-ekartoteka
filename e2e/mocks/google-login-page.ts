/**
 * Sign-in page served by the Google mock when no identity is queued (local
 * development only). The page is a static file in ./google-login; its field
 * names must match GOOGLE_LOGIN_EMAIL_PARAM and GOOGLE_LOGIN_NAME_PARAM.
 */

export const LOGIN_FORM_PAGE = new URL(
  './google-login/index.html',
  import.meta.url
);

const LOGIN_FORM_ASSETS = new Map<string, { file: URL; contentType: string }>([
  [
    '/login-form.js',
    {
      file: new URL('./google-login/login-form.js', import.meta.url),
      contentType: 'text/javascript; charset=utf-8',
    },
  ],
  [
    '/login-form.css',
    {
      file: new URL('./google-login/login-form.css', import.meta.url),
      contentType: 'text/css; charset=utf-8',
    },
  ],
]);

/** The script or stylesheet of the sign-in page, by its route under the Google path. */
export function loginFormAsset(route: string) {
  return LOGIN_FORM_ASSETS.get(route);
}
