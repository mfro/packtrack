import { CURRENT_VERSION } from '.';
import { clone } from './serialize';
import { assert } from './util';

export interface Library {
  version: number;

  nextId: number;
  items: { [id: number]: Item };
}

export interface Item {
  id: number;
  label: string;
  weight?: number; // grams
  notes?: string;
  category?: string;
}

export interface List {
  id: number;

  label: string;
  items: ListItem[];
}

export interface ListItem {
  itemId: number;
  count: number;
}

export function newLibrary(): Library {
  return {
    version: CURRENT_VERSION,

    nextId: 1,
    items: {},
  };
}

export function isValidItem(item: Item) {
  return item.label.trim().length > 0 && item.label.trim().length < 1024
    && (!('weight' in item) || typeof item.weight == 'number' && item.weight % 1 === 0)
    && (!('notes' in item) || item.label.trim().length > 0 && item.label.trim().length < 1024)
}

export interface Operation<A extends unknown[] = unknown[]> {
  name: string;
  impl: (library: Library, ...args: A) => void,
}

export const operations = new Map<string, Operation<any>>();

function define<A extends unknown[]>(name: string, impl: (library: Library, ...args: A) => void): Operation<A> {
  const op = Object.freeze({
    name,
    impl,
  });

  operations.set(name, op);

  return op;
}

export const ADD_ITEM = define('ADD_ITEM', (library, item: Item) => {
  const id = library.nextId++;

  library.items[id] = {
    ...clone(item),
    id,
  };
});

export const UPDATE_ITEM = define('UPDATE_ITEM', (library, item: Item) => {
  assert(item.id in library.items, 'invalid update item');

  library.items[item.id] = {
    ...clone(item),
  };
});

export const DELETE_ITEM = define('DELETE_ITEM', (library, id: number) => {
  assert(id in library.items, 'invalid delete item');

  delete library.items[id];
});
