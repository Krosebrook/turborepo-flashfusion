/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Wait for an element to appear (placeholder for DOM testing)
 */
export async function waitForElement(selector: string, timeout: number = 5000): Promise<void> {
  await waitFor(() => {
    // This would integrate with testing library in real implementation
    return document.querySelector(selector) !== null;
  }, { timeout });
}