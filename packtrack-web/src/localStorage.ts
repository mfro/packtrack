import { CURRENT_VERSION, deserialize, newLibrary, serialize, type Item, type Library, type List } from 'packtrack-common';
import { ref, toRaw, watch } from 'vue';

export interface GlobalState {
  version: number,
  library: Library,

  editList: List | null,
  editItem: Item | null,
  createItem: Item | null,
  selectedItems: Set<Item>,
  listEditMode: boolean,

  inputQuickItem: string | null,
  inputQuickItemTarget: Item | null,

  showUsedItems: boolean,
  inputCategory: string,
}

function newGlobalState(): GlobalState {
  const oldLibrary = load<Library | null>('mfro:packtrack:library', () => null);

  const library = oldLibrary ?? newLibrary();

  return {
    version: CURRENT_VERSION,
    library,
    editList: null,
    editItem: null,
    createItem: null,
    selectedItems: new Set(),
    listEditMode: false,
    inputQuickItem: null,
    inputQuickItemTarget: null,
    showUsedItems: true,
    inputCategory: '',
  };
}

function load<T>(key: string, initializer: () => T): T {
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

  return raw;
}

function save<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(serialize(toRaw(value))));
}

const key = 'mfro:packtrack:state';
export const state = ref<GlobalState>(load(key, newGlobalState));
watch(state, value => save(key, value), { deep: true });

Object.assign(window, { state });

if (state.value.version < 2) {
  state.value.selectedItems = new Set();
}

if (state.value.version < 3) {
  state.value.inputQuickItem = null;
  state.value.inputQuickItemTarget = null;
}

if (state.value.version < 4) {
  state.value.listEditMode = false;
}

state.value.version = CURRENT_VERSION;
