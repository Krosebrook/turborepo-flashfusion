import React from 'react';

/**
 * Render component with providers for testing
 */
export function renderWithProviders(ui: React.ReactElement, options = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement('div', { 'data-testid': 'test-wrapper' }, children);
  }

  // Return simplified mock for now - in real implementation would use @testing-library/react
  return {
    container: document.createElement('div'),
    rerender: () => {},
    unmount: () => {}
  };
}