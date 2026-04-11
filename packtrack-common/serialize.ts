import { assert, map } from './util';

const META_KEY = '_mfro';

export type Serializable =
  | any
  | Date
  | string
  | number
  | bigint
  | boolean
  | null
  | Serializable[]
  | Set<Serializable>

export function serialize(t: Serializable): unknown {
  const seen = new Map<any, number>();

  return serialize(t);

  function serialize(t: Serializable): unknown {
    switch (typeof t) {
      case 'function':
      case 'symbol':
      case 'undefined':
        debugger;
        throw new Error('not supported');

      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        return t;

      case 'object':
        if (t === null)
          return null;

        if (seen.has(t)) {
          return { [META_KEY]: 'seen', value: seen.get(t) };
        }

        let result;
        if (t.constructor === Object) {
          assert(!(META_KEY in t), 'invalid meta key')

          result = map(t as any, (k, v) => serialize(v));
        } else if (Array.isArray(t)) {
          result = t.map(serialize);
        } else if (t instanceof Date) {
          result = { [META_KEY]: 'Date', value: t.toISOString() };
        } else if (t instanceof Set) {
          result = { [META_KEY]: 'Set', value: [...t].map(serialize) };
        } else {
          assert(false, `unknown type: ${t}`);
        }

        seen.set(t, seen.size);
        return result;
    }
  }
}

export function deserialize(t: unknown): Serializable {
  const known: any[] = [];

  return deserialize(t);

  function deserialize(t: unknown): Serializable {
    switch (typeof t) {
      case 'function':
      case 'symbol':
      case 'undefined':
        debugger;
        throw new Error('not supported');

      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        return t;

      case 'object':
        if (t === null)
          return null;

        let value;
        if (Array.isArray(t)) {
          value = t.map(deserialize);
        } else if (META_KEY in t) {
          assert(typeof t[META_KEY] === 'string' && 'value' in t, 'invalid object');
          const type = t[META_KEY];

          if (type === 'seen') {
            assert(typeof t.value === 'number', 'invalid seen');

            assert(t.value < known.length, 'invalid reference');
            return known[t.value]!;
          } else if (type === 'Date') {
            assert(typeof t.value === 'string', 'invalid date');
            value = new Date(t.value);
          } else if (type == 'Set') {
            assert(Array.isArray(t.value), 'invalid set');
            value = new Set(t.value.map(deserialize));
          } else {
            assert(false, `unknown type: ${type}`);
          }
        } else {
          value = map(t as any, (k, v) => deserialize(v));
        }

        known.push(value);
        return value;
    }
  }
}

export function clone<T extends Serializable>(t: T): T {
  const seen = new Map<any, number>();
  const known: any[] = [];

  return clone(t);

  function clone<T extends Serializable>(t: T): T {
    switch (typeof t) {
      case 'function':
      case 'symbol':
      case 'undefined':
        debugger;
        throw new Error('not supported');

      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        return t;

      case 'object':
        if (t === null)
          return t;

        if (seen.has(t)) {
          return known[seen.get(t)!];
        }

        let value;
        if (t.constructor === Object) {
          value = map(t as any, (k, v) => clone(v));
        } else if (Array.isArray(t)) {
          value = t.map(clone);
        } else if (t instanceof Date) {
          value = t;
        } else if (t instanceof Set) {
          value = new Set([...t].map(clone));
        } else {
          assert(false, `unknown type: ${t}`);
        }

        seen.set(t, seen.size);
        known.push(value);
        return value;
    }
  }
}
