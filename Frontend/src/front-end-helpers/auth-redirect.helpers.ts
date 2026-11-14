const defaultRedirectPath = '/Home';

/**
 * Name: getSafeRedirectPath.
 * Returns: The redirect path when it is a same-site page, otherwise '/Home'.
 * Parameters: redirect, the raw `redirect` query value (may be null).
 * Description: Prevents open redirects by allowing only paths that start with a single '/', and avoids sending the user back to the login page.
 */
export const getSafeRedirectPath = (redirect: string | null): string => {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('\\')) return defaultRedirectPath;
  if (redirect.toLowerCase().startsWith('/login')) return defaultRedirectPath;

  return redirect;
};

/**
 * Name: buildLoginPath.
 * Returns: The login URL carrying the current page as its `redirect` query value.
 * Parameters: currentPath, the page (path and query) to return to after sign-in.
 * Description: Lets sign-in prompts send the user back to where they were once they sign in.
 */
export const buildLoginPath = (currentPath: string): string => `/Login?redirect=${encodeURIComponent(getSafeRedirectPath(currentPath))}`;
