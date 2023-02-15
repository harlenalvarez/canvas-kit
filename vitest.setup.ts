import { afterAll, beforeAll, vi } from 'vitest';
beforeAll(() => {
  vi.stubGlobal('Path2D', vi.fn(() => ({
    rect: vi.fn(),
    roundRect: vi.fn()
  })));
});

afterAll(() => {
  vi.unstubAllGlobals();
});