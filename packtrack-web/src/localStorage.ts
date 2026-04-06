import { deserialize, migrate, newLibrary, serialize, type Library } from 'packtrack-common';
import { reactive, toRaw, watch } from 'vue';

export function persist<T extends object>(key: string, initializer: () => T) {
  let raw: T;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      raw = deserialize(JSON.parse(stored));
    } else {
      raw = initializer();
    }
  } catch {
    raw = initializer();
  }

  const value = reactive(raw);

  watch(value, () => {
    window.localStorage.setItem(key, JSON.stringify(serialize(toRaw(value))));
  });

  return value;
}

export const library = persist<Library>('mfro:packtrack:library', newLibrary);
migrate(library);

Object.assign(window, { library });
