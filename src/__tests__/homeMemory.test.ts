import { beforeEach, describe, expect, it } from 'vitest';
import { buildHomeNavigationState, readHomeMemory, writeHomeMemory } from '../lib/homeMemory';

describe('homeMemory', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('writes and reads persisted home memory', () => {
    writeHomeMemory({
      homeSection: 'directory',
      homeScrollTop: 842,
      directoryPage: 3,
    });

    expect(readHomeMemory()).toEqual({
      homeSection: 'directory',
      homeScrollTop: 842,
      directoryPage: 3,
    });
  });

  it('builds navigation state from stored memory', () => {
    writeHomeMemory({
      homeSection: 'lab',
      homeScrollTop: 1320,
      directoryPage: 1,
    });

    expect(buildHomeNavigationState()).toEqual({
      homeSection: 'lab',
      homeScrollTop: 1320,
      directoryPage: 1,
    });
  });

  it('applies overrides on top of stored memory', () => {
    writeHomeMemory({
      homeSection: 'lab',
      homeScrollTop: 1320,
      directoryPage: 1,
    });

    expect(buildHomeNavigationState({ homeSection: 'directory' })).toEqual({
      homeSection: 'directory',
      homeScrollTop: 1320,
      directoryPage: 1,
    });
  });

  it('returns null for invalid stored payloads', () => {
    window.sessionStorage.setItem(
      'catalogue.home-memory',
      JSON.stringify({ homeSection: 'nope', homeScrollTop: 'bad', directoryPage: -2 }),
    );

    expect(readHomeMemory()).toBeNull();
  });
});
