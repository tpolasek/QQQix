import { vi } from 'vitest';

// Track keyboard state for testing
const keyState = new Map<string, boolean>();

// Override window.addEventListener to track keyboard events
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type: string, listener: any, options?: any) {
  if (type === 'keydown' || type === 'keyup') {
    const wrappedListener = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      // Update key state
      if (type === 'keydown') {
        keyState.set(keyboardEvent.key, true);
      } else if (type === 'keyup') {
        keyState.set(keyboardEvent.key, false);
      }
      listener.call(this, event);
    };
    return originalAddEventListener.call(this, type, wrappedListener, options);
  }
  return originalAddEventListener.call(this, type, listener, options);
};

// Setup canvas context mock
const mockContext = {
  fillStyle: '',
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  shadowColor: '',
  shadowBlur: 0,
  font: '',
  textAlign: '',
  fillText: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return mockContext as unknown as CanvasRenderingContext2D;
  }
  return null;
});
