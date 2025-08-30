/**
 * UI utility functions
 */

/**
 * Utility function for combining class names
 * @param classes Array of class names or conditional classes
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate CSS variables for theme configuration
 * @param theme Theme configuration object
 * @returns CSS custom properties string
 */
export function generateCSSVariables(theme: Record<string, any>): string {
  const variables: string[] = [];
  
  function processObject(obj: Record<string, any>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const varName = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        processObject(value, varName);
      } else {
        variables.push(`--${varName}: ${value};`);
      }
    }
  }
  
  processObject(theme);
  return variables.join('\n');
}

/**
 * Convert hex color to RGB values
 * @param hex Hex color string
 * @returns RGB values as array
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

/**
 * Check if color is light or dark
 * @param hex Hex color string
 * @returns True if color is light
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const [r, g, b] = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}