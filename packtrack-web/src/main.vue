<template>
  <div class="app">
    <Flex class="gap-3 ma-3">
      <InputText v-model="input" @keyup.enter="onSubmit"
                 autofocus />

      <Flex class="gap-3">
        <Select editable :options="categories.map(o => o.name)"
                v-model="categoryValue" />

        <Button @click="applyCategory"
                :disabled="!isValidCategory(categoryValue)">
          <Icon :src="icon_save" />
          Save
        </Button>
      </Flex>
    </Flex>

    <Flex class="gap-3 ma-3">
      <Button @click="selected.clear()" icon="a" text rounded
              severity="secondary"
              :disabled="!selected.size">
        <Icon :src="icon_close" />
      </Button>
    </Flex>

    <Flex>
      <Flex grow column style="max-width: 60rem">
        <template v-for="category in categories">
          <h3 v-if="category.name">{{ category.name }}</h3>

          <template v-for="item in category.items">
            <Flex class="px-2 item" align-center>
              <label :for="`item-${item.id}`"
                     class="item-checkbox">
                <Checkbox :inputId="`item-${item.id}`" binary
                          :model-value="selected.has(item)"
                          @update:model-value="toggleSelected(item)" />
              </label>

              <Flex class="px-2 item-body" align-center grow
                    @click="addItem(item)"
                    @contextmenu.prevent="removeItem(item)"
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
                      @click="startEdit(item)">
                <Icon :src="icon_edit" />
              </Button>
            </Flex>
          </template>
        </template>
      </Flex>

      <Flex grow column style="max-width: 60rem">
        <InputText v-model="editList.label" />

        <span class="ma-3">total: {{ listWeight }}g</span>

        <Flex grow column>
          <template v-for="category in listCategories">
            <Flex align-baseline v-if="category.name">
              <h3>{{ category.name }}</h3>

              <span>{{ category.weight }}g</span>
            </Flex>

            <template v-for="{ item, count } in category.items">
              <Flex class="px-2 item" align-center>
                <Flex class="px-2 item-body" align-center grow
                      @click="addItem(item)"
                      @contextmenu.prevent="removeItem(item)"
                      @touchstart="() => { /* needed for mobile to show click effects */ }">

                  <span class="count">{{ count }}</span>
                  <span class="label">{{ item.label }}</span>
                  <span class="weight" v-if="item.weight">
                    {{ item.weight }}g
                  </span>
                  <span class="weight" v-else>&nbsp;</span>
                  <span class="notes" v-if="item.notes">{{ item.notes }}</span>
                  <span class="notes" v-else>&nbsp;</span>
                </Flex>

                <Button icon="a" severity="secondary" class="ml-2"
                        @click="startEdit(item)">
                  <Icon :src="icon_edit" />
                </Button>
              </Flex>
            </template>
          </template>
        </Flex>
      </Flex>
    </Flex>

    <Dialog :visible="!!createItem" @update:visible="createItem = undefined"
            header="Add Item" modal :dismissable-mask="false">
      <template v-if="createItem">
        <ItemEditor :model-value="createItem" @update:model-value="saveItem" />
      </template>
    </Dialog>

    <Dialog :visible="!!editItem" @update:visible="editItem = undefined"
            header="Edit Item" modal :dismissable-mask="false">
      <template v-if="editItem">
        <ItemEditor :model-value="editItem" @update:model-value="saveItem"
                    @delete="deleteItem" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Button, Checkbox, Dialog, InputText, Select } from 'primevue';
import { computed, shallowReactive, shallowRef } from 'vue';
import { ADD_ITEM, assert, DELETE_ITEM, UPDATE_ITEM, type List, type Item } from 'packtrack-common';
import ItemEditor from './ui/ItemEditor.vue';
import { library, persist } from './localStorage';
import { icon_close, icon_edit, icon_keyboard_arrow_down, icon_keyboard_arrow_up, icon_save } from './assets/symbols';
import Flex from './ui/Flex.vue';
import Icon from './ui/Icon.vue';

const input = shallowRef('');

const createItem = shallowRef<Item>();
const editItem = shallowRef<Item>();

const editList = persist<List>('mfro:packtrack:test-list', () => ({
  id: library.nextId,
  items: [],
  label: 'New list',
}));

function addItem(item: Item) {
  let entry = editList.items.find(e => e.itemId == item.id);
  if (!entry) editList.items.push(entry = { itemId: item.id, count: 0 });

  entry.count += 1;
}

function removeItem(item: Item) {
  const index = editList.items.findIndex(e => e.itemId == item.id);
  assert(index != -1, 'missing index');

  const entry = editList.items[index]!;

  entry.count -= 1;
  if (entry.count === 0) {
    editList.items.splice(index, 1);
  }
}

const listWeight = computed(() => editList.items
  .map(e => (library.items[e.itemId]!.weight ?? 0) * e.count)
  .reduce((a, b) => a + b));

const listCategories = computed(() => {
  return [...new Set(editList.items
    .map(i => library.items[i.itemId]!)
    .map(i => i.category ?? ''))]
    .sort((a, b) => a?.localeCompare(b))
    .map(name => {
      const items = editList.items
        .map(i => ({ item: library.items[i.itemId]!, count: i.count }))
        .filter(e => e.count > 0 && (e.item.category ?? '') == name)
        .sort((a, b) => (a.item.category ?? '').localeCompare(b.item.category ?? '')
          || a.item.label.localeCompare(b.item.label));

      const weight = items
        .map(e => (e.item.weight ?? 0) * e.count)
        .reduce((a, b) => a + b);

      return { name, items, weight };
    })
});

const categories = computed(() => {
  return [...new Set(Object.values(library.items)
    .map(i => i.category ?? ''))]
    .sort((a, b) => a?.localeCompare(b))
    .map(name => {
      const items = Object.values(library.items)
        .filter(i => (i.category ?? '') == name)
        .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '')
          || a.label.localeCompare(b.label));

      const weight = items
        .map(i => i.weight ?? 0)
        .reduce((a, b) => a + b);

      return { name, items, weight };
    })
});

const categoryValue = shallowRef('');
function isValidCategory(category: string) {
  return category.trim().length > 0 && category.trim().length < 1024
}

function applyCategory() {
  for (const item of selected) {
    if (!categoryValue.value) {
      delete item.category;
    } else {
      item.category = categoryValue.value;
    }
  }
}

const selected = shallowReactive(new Set<Item>());
function toggleSelected(item: Item) {
  if (!selected.delete(item)) {
    selected.add(item)
  }
}

function onSubmit(e: KeyboardEvent) {
  if (e.shiftKey) {
    createItem.value = {
      id: 0,
      label: input.value,
    };

    input.value = ''
  }
}

function startEdit(item: Item) {
  editItem.value = item;
}

function saveItem(item: Item) {
  if (createItem.value) {
    ADD_ITEM.impl(library, item);
    createItem.value = undefined;
  } else {
    UPDATE_ITEM.impl(library, item);
    editItem.value = undefined;
  }
}

function deleteItem() {
  assert(!!editItem.value, 'invalid delete item');

  DELETE_ITEM.impl(library, editItem.value.id);
  editItem.value = undefined;
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

  > .item-body {
    min-height: 2rem;
    // height: 2rem;
    padding: 0 0.5rem;
    border-radius: var(--p-border-radius-md);
    @include interactive-list-item;

    > .count {
      flex: 0 0 3ch;
      text-align: right;
      margin-right: 1ch;
      // position: relative;
      // display: flex;
      // justify-content: center;

      // > * {
      //   position: absolute;
      //   left: 0;
      //   right: 0;
      //   text-align: center;
      //   opacity: 0;
      //   transition: opacity 80ms ease-in-out;
      //   pointer-events: none;

      //   &:nth-child(1) {
      //     top: -65%;
      //   }

      //   &:nth-child(2) {
      //     bottom: -65%;
      //   }
      // }
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

  @media (hover: hover) {
    &:hover > button {
      opacity: 1;
    }

    &:hover > .item-body:not(:hover):not(:active) {
      background-color: var(--interactive-background-color);
    }

    &:hover > .item-body > .count > * {
      opacity: 1;
    }
  }
}

.category {
  max-width: 20rem;

  height: 2rem;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);

  > span:nth-child(1) {
    flex: 4 0 0;
  }

  > span:nth-child(2) {
    flex: 3 0 0;
  }
}
</style>
