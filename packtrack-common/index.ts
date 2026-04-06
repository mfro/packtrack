import type { Library } from './model';

export * from './util';
export * from './serialize';
export * from './model';

export const CURRENT_VERSION = 1;

export function newLibrary(): Library {
  return {
    version: CURRENT_VERSION,

    nextId: 1,
    items: {},
    lists: {},
  };
}

export function migrate(library: Library) {
  if (library.version === 0) {
    library.lists = {};

    library.version = 1;
  }
}
