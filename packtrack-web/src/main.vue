<template>
  <div class="app">
    <Flex>
      <Flex column class="gap-3 my-3" style="flex: 0 0 60rem">
        <Flex class="gap-3 mx-3">
          <Button @click="startAddItem()">
            <Icon :src="icon_add" />
            Add Item
          </Button>

          <ToggleButton v-model="state.showUsedItems">
            <Icon
                  :src="state.showUsedItems ? icon_visibility : icon_visibility_off" />
            Used Items
          </ToggleButton>
        </Flex>

        <Flex class="gap-3 mx-3">
          <Button @click="state.selectedItems.clear(), state.inputCategory = ''"
                  icon="a"
                  text
                  rounded
                  severity="secondary"
                  :disabled="!(state.selectedItems.size || state.inputCategory)">
            <Icon :src="icon_close" />
          </Button>

          <template v-if="state.selectedItems.size">
            <Flex class="gap-3">
              <Select editable :options="categories.map(o => o.name)"
                      v-model="state.inputCategory" />

              <Button @click="applyCategory"
                      :disabled="!isValidCategory(state.inputCategory) || !state.selectedItems.size">
                <Icon :src="icon_save" />
                Save
              </Button>
            </Flex>
          </template>
        </Flex>

        <Flex column>
          <template v-for="category in categories">
            <h3 v-if="category.name">{{ category.name }}</h3>

            <template v-for="item in category.items">
              <Flex class="px-2 item" :class="{ active: !!state.editList }"
                    align-center>

                <label :for="`item-${item.id}`"
                       class="item-checkbox">
                  <Checkbox :inputId="`item-${item.id}`" binary
                            :model-value="state.selectedItems.has(item)"
                            @update:model-value="toggleSelected(item)" />
                </label>

                <Flex class="px-2 item-body" align-center grow
                      @click="state.editList && addItem(item)"
                      @contextmenu.prevent="state.editList && removeItem(item)"
                      @touchstart="() => { /* needed for mobile to show click effects */ }">

                  <span class="label">{{ item.label }}</span>
                  <span class="weight" v-if="item.weight">
                    {{ item.weight }}g
                  </span>
                  <span class="weight" v-else>&nbsp;</span>
                  <span class="notes" v-if="item.notes">{{ item.notes }}</span>
                  <span class="notes" v-else>&nbsp;</span>
                </Flex>

                <Button icon="a" severity="secondary" class="ml-2"
                        @click="startEditItem(item)">
                  <Icon :src="icon_edit" />
                </Button>
              </Flex>
            </template>
          </template>
        </Flex>
      </Flex>

      <Flex column style="flex: 0 0 60rem" class="gap-3 my-3">
        <template v-if="state.editList">
          <Flex class="gap-3" align-center>
            <Button @click="selectList(null)" icon="a" text rounded
                    severity="secondary"
                    style="flex: 0 0 auto;">
              <Icon :src="icon_chevron_left" />
            </Button>

            <template v-if="state.listEditMode">
              <!-- TODO: fix this direct modification -->
              <InputText v-model="state.editList.label" fluid />
            </template>
            <template v-else>
              <h2 style="flex: 1">{{ state.editList.label }}</h2>
            </template>

            <ToggleButton v-model="state.listEditMode" style="flex: 0 0 auto" size="small">
              <Icon :src="state.listEditMode ? icon_edit : icon_edit_off" />
            </ToggleButton>
          </Flex>

          <template v-if="state.listEditMode">
            <!-- TODO: fix this direct modification -->
            <Textarea v-model="state.editList.notes" auto-resize />
          </template>
          <template v-else>
            <div class="list-notes">{{ state.editList.notes }}</div>
          </template>

          <template v-if="state.listEditMode">
            <Flex class="gap-3">
              <Button type="button"
                      @click="e => addListMenu?.toggle(e)">

                <Icon :src="icon_add"
                      style="margin: -10em 0" />
                Include List
              </Button>

              <Menu ref="addListMenu" id="overlay_menu"
                    :model="addListOptions"
                    :popup="true" />

              <Flex grow />

              <Button @click="deleteList" severity="danger">
                <Icon :src="icon_delete" />
                Delete
              </Button>
            </Flex>
          </template>

          <span>total: {{ listWeight }}g</span>

          <Flex grow column>
            <template v-for="category in listCategories">
              <Flex align-baseline v-if="category.name">
                <h3>{{ category.name }}</h3>

                <span>{{ category.weight }}g</span>
              </Flex>

              <template v-for="{ item, count } in category.items">
                <Flex class="px-2 item" align-center
                      :class="{ active: state.listEditMode }">
                  <Flex class="px-2 item-body" align-center grow
                        @click="state.listEditMode && addItem(item)"
                        @contextmenu.prevent="state.listEditMode && removeItem(item)"
                        @touchstart="() => { /* needed for mobile to show click effects */ }">

                    <span class="count">{{ count }}</span>
                    <span class="label">{{ item.label }}</span>
                    <span class="weight" v-if="item.weight">
                      {{ item.weight }}g
                    </span>
                    <span class="weight" v-else>&nbsp;</span>
                    <span class="notes" v-if="item.notes">{{ item.notes
                    }}</span>
                    <span class="notes" v-else>&nbsp;</span>
                  </Flex>

                  <Button icon="a" severity="secondary" class="ml-2"
                          @click="startEditItem(item)">
                    <Icon :src="icon_edit" />
                  </Button>
                </Flex>
              </template>
            </template>
          </Flex>
        </template>

        <template v-else>
          <Flex grow column class="gap-3">
            <Flex grow column>
              <template v-for="entry in lists">
                <Flex class="list" column
                      @click="selectList(entry.list)"
                      @touchstart="() => { /* needed for mobile to show click effects */ }">

                  <h2 class="label">{{ entry.list.label }}</h2>
                  <span class="weight" v-if="entry.weight">
                    {{ entry.weight }}g
                  </span>
                </Flex>
              </template>

              <Flex class="ma-3" justify-start>
                <Button type="button" @click="startAddList">
                  <Icon :src="icon_add" style="margin: -10em 0" />
                  Add List
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </template>
      </Flex>
    </Flex>

    <Dialog :visible="!!state.createItem"
            @update:visible="state.createItem = null"
            header="Add Item" modal :dismissable-mask="false">
      <template v-if="state.createItem">
        <ItemEditor :model-value="state.createItem"
                    @update:model-value="saveItem" />
      </template>
    </Dialog>

    <Dialog :visible="!!state.editItem" @update:visible="state.editItem = null"
            header="Edit Item" modal :dismissable-mask="false">
      <template v-if="state.editItem">
        <ItemEditor :model-value="state.editItem" @update:model-value="saveItem"
                    @delete="deleteItem" />
      </template>
    </Dialog>

    <Dialog :visible="state.inputQuickItem !== null"
            @update:visible="state.inputQuickItem = null" modal
            :dismissable-mask="false"
            style="border: none; background: none; box-shadow: none;">
      <template #container>
        <Flex column align-center justify-start style="min-height: 36rem;">
          <InputText autofocus class="quick-item"
                     v-model="state.inputQuickItem"
                     style="width: 30ch"
                     @keydown="onQuickItemKeyDown" />

          <template v-if="quickItemResults.length">
            <Flex column class="quick-item-results pa-2 mt-3"
                  style="width: 60rem">
              <template v-for="item in quickItemResults">
                <Flex class="px-2 py-1 item-body" align-center
                      :class="{ active: item == state.inputQuickItemTarget }">
                  <template v-if="state.editList">
                    <span class="count">
                      {{state.editList.items.find(i =>
                        i.itemId == item.id)?.count ?? ''}}
                    </span>
                  </template>
                  <span class="label">{{ item.label }}</span>
                  <span class="weight" v-if="item.weight">
                    {{ item.weight }}g
                  </span>
                  <span class="weight" v-else>&nbsp;</span>
                  <span class="notes" v-if="item.notes">{{ item.notes }}</span>
                  <span class="notes" v-else>&nbsp;</span>
                </Flex>
              </template>
            </Flex>
          </template>
        </Flex>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Button, Checkbox, Dialog, InputText, Menu, Select, Textarea, ToggleButton } from 'primevue';
import type { MenuItem } from 'primevue/menuitem';
import { computed, useTemplateRef, watchEffect } from 'vue';
import { ADD_ITEM, assert, DELETE_ITEM, UPDATE_ITEM, type List, type Item, clone, ADD_LIST_ITEM, REMOVE_LIST_ITEM, ADD_LIST, DELETE_LIST } from 'packtrack-common';
import ItemEditor from './ui/ItemEditor.vue';
import { state } from './localStorage';
import { apply, markRestorePoint } from './driver';
import { icon_add, icon_chevron_left, icon_close, icon_delete, icon_edit, icon_edit_off, icon_save, icon_visibility, icon_visibility_off } from './assets/symbols';
import Flex from './ui/Flex.vue';
import Icon from './ui/Icon.vue';

const visibleItems = computed(() => Object.values(state.value.library.items)
  .filter(i => state.value.showUsedItems || !state.value.editList || !state.value.editList.items.some(e => e.itemId == i.id)));

const quickItemResults = computed(() => {
  if (!state.value.inputQuickItem) return [];
  const regex = new RegExp(state.value.inputQuickItem, 'gi');
  const matches = Object.values(state.value.library.items)
    .filter(i => {
      const string = `${i.label} ${i.weight} ${i.notes} ${i.category}`;
      return regex.test(string);
    });

  return matches.slice(0, 12);
});

watchEffect(() => {
  if (quickItemResults.value.length == 0) {
    state.value.inputQuickItemTarget = null;
  } else if (!quickItemResults.value.includes(state.value.inputQuickItemTarget!)) {
    state.value.inputQuickItemTarget = quickItemResults.value[0]!;
  }
});

function onQuickItemKeyDown(e: KeyboardEvent) {
  const index = quickItemResults.value.indexOf(state.value.inputQuickItemTarget!);
  if (index != -1) {
    if (e.key == 'ArrowUp') {
      const nextIndex = index == 0 ? quickItemResults.value.length - 1 : index - 1;
      state.value.inputQuickItemTarget = quickItemResults.value[nextIndex]!;
      e.preventDefault();
    } else if (e.key == 'ArrowDown') {
      const nextIndex = (index + 1) % quickItemResults.value.length;
      state.value.inputQuickItemTarget = quickItemResults.value[nextIndex]!;
      e.preventDefault();
    } else if (e.key == 'Enter') {
      if (e.shiftKey) {
        removeItem(state.value.inputQuickItemTarget!);
      } else {
        addItem(state.value.inputQuickItemTarget!);
      }
    }
  }
}

const addListMenu = useTemplateRef('addListMenu');

const addListOptions = computed<MenuItem[]>(() => {
  if (!state.value.editList) return [];
  return Object.values(state.value.library.lists)
    .filter(l => l != state.value.editList)
    .map(v => ({
      label: v.label,
      command: () => includeList(v),
    }));
});

function addItem(item: Item) {
  assert(!!state.value.editList, 'invalid add item');
  const listId = state.value.editList.id;
  markRestorePoint();
  apply(ADD_LIST_ITEM, listId, item.id);
}

function removeItem(item: Item) {
  assert(!!state.value.editList, 'invalid remove item');
  const listId = state.value.editList.id;
  markRestorePoint();
  apply(REMOVE_LIST_ITEM, listId, item.id);
}

function includeList(list: List) {
  assert(!!state.value.editList, 'invalid include list');
  const listId = state.value.editList.id;
  markRestorePoint();
  // TODO optimize this
  for (const entry of list.items) {
    for (let i = 0; i < entry.count; ++i) {
      apply(ADD_LIST_ITEM, listId, entry.itemId);
    }
  }
}

function selectList(list: List | null) {
  state.value.editList = list;
}

function deleteList() {
  assert(!!state.value.editList, 'invalid delete list');
  const id = state.value.editList.id;
  markRestorePoint();
  apply(DELETE_LIST, id);
  state.value.editList = null;
}

function getListWeight(list: List) {
  const weight = list.items
    .map(e => (state.value.library.items[e.itemId]!.weight ?? 0) * e.count)
    .reduce((a, b) => a + b, 0);

  return weight;
}

const lists = computed(() => Object.values(state.value.library.lists)
  .map(list => {
    const weight = getListWeight(list);

    return { list, weight };
  }));

const listWeight = computed(() => state.value.editList && getListWeight(state.value.editList));

const listCategories = computed(() => {
  return state.value.editList && [...new Set(state.value.editList.items
    .map(i => state.value.library.items[i.itemId]!)
    .map(i => i.category ?? ''))]
    .sort((a, b) => a?.localeCompare(b))
    .map(name => {
      const items = state.value.editList!.items
        .map(i => ({ item: state.value.library.items[i.itemId]!, count: i.count }))
        .filter(e => e.count > 0 && (e.item.category ?? '') == name)
        .sort((a, b) => (a.item.category ?? '').localeCompare(b.item.category ?? '')
          || a.item.label.localeCompare(b.item.label));

      const weight = items
        .map(e => (e.item.weight ?? 0) * e.count)
        .reduce((a, b) => a + b, 0);

      return { name, items, weight };
    })
});

const categories = computed(() => {
  return [...new Set(visibleItems.value
    .map(i => i.category ?? ''))]
    .sort((a, b) => a?.localeCompare(b))
    .map(name => {
      const items = visibleItems.value
        .filter(i => (i.category ?? '') == name)
        .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '')
          || a.label.localeCompare(b.label));

      const weight = items
        .map(i => i.weight ?? 0)
        .reduce((a, b) => a + b, 0);

      return { name, items, weight };
    })
});

function isValidCategory(category: string) {
  return category.trim().length > 0 && category.trim().length < 1024
}

function applyCategory() {
  markRestorePoint();
  for (const item of state.value.selectedItems) {
    const update = clone(item);
    if (!state.value.inputCategory) {
      delete update.category;
    } else {
      update.category = state.value.inputCategory;
    }
    apply(UPDATE_ITEM, update);
  }
}

function toggleSelected(item: Item) {
  if (!state.value.selectedItems.delete(item)) {
    state.value.selectedItems.add(item)
  }
}

function startAddItem() {
  state.value.createItem = {
    id: 0,
    label: '',
  };
}

function startEditItem(item: Item) {
  state.value.editItem = item;
}

function saveItem(item: Item) {
  if (state.value.createItem) {
    markRestorePoint();
    apply(ADD_ITEM, item);
    state.value.createItem = null;
  } else {
    markRestorePoint();
    apply(UPDATE_ITEM, item);
    state.value.editItem = null;
  }
}

function deleteItem() {
  assert(!!state.value.editItem, 'invalid delete item');

  markRestorePoint();
  apply(DELETE_ITEM, state.value.editItem.id);
  state.value.editItem = null;
}

function startAddList() {
  markRestorePoint();

  const now = new Date();

  const id = state.value.library.nextId;

  apply(ADD_LIST, {
    id: 0,
    label: `${now.getFullYear()}-${now.getMonth().toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
    items: [],
  });

  state.value.editList = state.value.library.lists[id]!;
}
</script>

<style scoped lang="scss">
@use "@/common.scss" as *;

h3 {
  margin: 0.75rem 1rem 0.25rem;
}

.item {
  > label {
    cursor: pointer;
    width: var(--p-button-icon-only-width);
    height: 2rem;
    margin: -100px 0;
    display: flex;
    align-items: center;
    justify-content: center
  }

  > button {
    height: 2rem;
    opacity: 0;
    transition: opacity 80ms ease-in-out;
  }

  &.active > .item-body {
    @include interactive-list-item;
  }

  @media (hover: hover) {
    &:hover > button {
      opacity: 1;
    }

    &:hover > .item-body {
      background-color: var(--interactive-background-color);
    }
  }
}

.item-body {
  min-height: 2rem;
  border-radius: var(--p-border-radius-md);

  > .count {
    flex: 0 0 3ch;
    text-align: right;
    margin-right: 1ch;
  }

  > .label {
    flex: 5 0 0;
  }

  > .weight {
    flex: 2 0 0;
  }

  > .notes {
    flex: 13 0 0;
  }
}

.list {
  padding: 0.5rem 0.75rem;
  border-radius: var(--p-border-radius-md);
  @include interactive-list-item;

  > .label {
    flex: 4 0 0;

  }

  > .weight {
    flex: 3 0 0;
  }
}

.list-notes {
  white-space: pre;
}

.quick-item {
  font-size: 2rem;
}

.quick-item-results {
  background-color: var(--background-color);
  border-radius: var(--p-border-radius-md);

  .item-body {
    &.active {
      background-color: var(--interactive-hover-color);
    }
  }
}
</style>
