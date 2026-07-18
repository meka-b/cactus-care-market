jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
  };
});

describe('resolveImageUrl', () => {
  let resolveImageUrl;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.REACT_APP_BACKEND_URL = 'http://mock-backend.com';
    resolveImageUrl = require('../api').resolveImageUrl;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns empty string if url is falsy', () => {
    expect(resolveImageUrl(null)).toBe('');
    expect(resolveImageUrl(undefined)).toBe('');
    expect(resolveImageUrl('')).toBe('');
  });

  it('returns the url itself if it starts with http', () => {
    expect(resolveImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
    expect(resolveImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
  });

  it('prepends BACKEND_URL if url is relative', () => {
    const url = '/api/media/image.jpg';
    const resolved = resolveImageUrl(url);
    expect(resolved).toBe('http://mock-backend.com/api/media/image.jpg');
  });
});
