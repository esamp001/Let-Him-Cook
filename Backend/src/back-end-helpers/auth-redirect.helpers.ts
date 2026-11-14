const defaultRedirectPath = '/Home';

/**
 * Name: getSafeRedirectPath.
 * Returns: The redirect path when it is a same-site page, otherwise '/Home'.
 * Parameters: redirect, the requested redirect path (may be undefined).
 * Description: Prevents open redirects after Google sign-in by allowing only paths that start with a single '/', and avoids redirecting back to the login page.
 */
export const getSafeRedirectPath = (redirect: string | undefined): string => {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('\\')) return defaultRedirectPath;
  if (redirect.toLowerCase().startsWith('/login')) return defaultRedirectPath;

  return redirect;
};
