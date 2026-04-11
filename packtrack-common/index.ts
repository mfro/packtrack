import type { Library } from './model';

export * from './util';
export * from './serialize';
export * from './model';

export const CURRENT_VERSION = 2;

export function newLibrary(): Library {
  return {
    nextId: 1,
    items: {},
    lists: {},
  };
}

export function migrate(library: Library, version: number) {
  if (version === 0) {
    library.lists = {};
  }
}
