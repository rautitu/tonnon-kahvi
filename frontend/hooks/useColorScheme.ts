/**
 * Force dark color scheme regardless of system preference.
 * Change this to use useRNColorScheme() if you want to follow system settings.
 */
export function useColorScheme() {
  return 'dark' as const;
}
