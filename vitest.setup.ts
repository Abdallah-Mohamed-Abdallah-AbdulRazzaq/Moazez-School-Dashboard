import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:3001/api/v1';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/en/dashboard',
  useParams: () => ({ lang: 'en' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', async () => {
  const enMessages = (await import('./src/messages/en.json')).default;
  const translators = new Map<string, (
    key: string,
    values?: Record<string, string | number>,
  ) => string>();

  return {
    useTranslations: (namespace = '') => {
      const cachedTranslator = translators.get(namespace);
      if (cachedTranslator) return cachedTranslator;

      const translator = (
        key: string,
        values?: Record<string, string | number>,
      ) => {
        const path = namespace ? `${namespace}.${key}` : key;
        if (!path.startsWith('academic_content.')) return key;

        let message: unknown = enMessages;
        for (const segment of path.split('.')) {
          if (!message || typeof message !== 'object' || !(segment in message)) return key;
          message = (message as Record<string, unknown>)[segment];
        }
        if (typeof message !== 'string') return key;
        if (!values) return message;
        return message.replace(/\{(\w+)\}/g, (placeholder, valueKey: string) =>
          valueKey in values ? String(values[valueKey]) : placeholder,
        );
      };
      translators.set(namespace, translator);
      return translator;
    },
    useLocale: () => 'en',
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];

  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
