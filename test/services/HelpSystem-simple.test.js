import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Simple Fetch Mock Test', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('test mock fetch with manifest array', async () => {
    const mockManifest = [
      { toolName: 'test', metadata: { title: { fr: 'Test' } } }
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockManifest
    });

    const response = await fetch('/test');
    const data = await response.json();

    console.log('Response:', response);
    console.log('Data:', data);
    console.log('Is array?', Array.isArray(data));
    console.log('Type:', typeof data);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });
});
