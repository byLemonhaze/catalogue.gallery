import type { HomeSectionKey } from '../constants/homeSections';

export interface StoredHomeMemory {
  homeSection: HomeSectionKey;
  homeScrollTop: number;
  directoryPage: number;
}

const HOME_MEMORY_STORAGE_KEY = 'catalogue.home-memory';
const HOME_SECTIONS: HomeSectionKey[] = ['hero', 'directory', 'lab', 'apply'];

function isHomeSectionKey(value: unknown): value is HomeSectionKey {
  return typeof value === 'string' && HOME_SECTIONS.includes(value as HomeSectionKey);
}

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function readHomeMemory(): StoredHomeMemory | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(HOME_MEMORY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredHomeMemory>;
    if (!isHomeSectionKey(parsed.homeSection)) return null;

    return {
      homeSection: parsed.homeSection,
      homeScrollTop: Math.max(0, toFiniteNumber(parsed.homeScrollTop, 0)),
      directoryPage: Math.max(0, Math.floor(toFiniteNumber(parsed.directoryPage, 0))),
    };
  } catch {
    return null;
  }
}

export function writeHomeMemory(memory: StoredHomeMemory) {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(HOME_MEMORY_STORAGE_KEY, JSON.stringify(memory));
}

export function buildHomeNavigationState(overrides: Partial<StoredHomeMemory> = {}) {
  const stored = readHomeMemory();
  const next = {
    ...(stored ?? {}),
    ...overrides,
  };

  if (!isHomeSectionKey(next.homeSection)) return undefined;

  return {
    homeSection: next.homeSection,
    homeScrollTop: Math.max(0, toFiniteNumber(next.homeScrollTop, 0)),
    directoryPage: Math.max(0, Math.floor(toFiniteNumber(next.directoryPage, 0))),
  };
}

