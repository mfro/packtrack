<template>
  <div class="app">
    <Flex>
      <Flex column style="flex: 0 0 60rem">
        <Flex class="gap-3 ma-3">
          <Button @click="startAddItem()">
            <Icon :src="icon_add" />
            Add Item
          </Button>

          <ToggleButton v-model="showUsedItems">
            <Icon
                  :src="showUsedItems ? icon_visibility : icon_visibility_off" />
            Used Items
          </ToggleButton>
        </Flex>

        <Flex class="gap-3 ma-3">
          <Button @click="selected.clear(), categoryValue = ''" icon="a" text
                  rounded
                  severity="secondary"
                  :disabled="!(selected.size || categoryValue)">
            <Icon :src="icon_close" />
          </Button>

          <template v-if="selected.size">
            <Flex class="gap-3">
              <Select editable :options="categories.map(o => o.name)"
                      v-model="categoryValue" />

              <Button @click="applyCategory"
                      :disabled="!isValidCategory(categoryValue) || !selected.size">
                <Icon :src="icon_save" />
                Save
              </Button>
            </Flex>
          </template>
        </Flex>

        <template v-for="category in categories">
          <h3 v-if="category.name">{{ category.name }}</h3>

          <template v-for="item in category.items">
            <Flex class="px-2 item" :class="{ active: !!editList }"
                  align-center>

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
                      @click="startEditItem(item)">
                <Icon :src="icon_edit" />
              </Button>
            </Flex>
          </template>
        </template>
      </Flex>

      <Flex column style="flex: 0 0 60rem" class="gap-3 my-3">
        <template v-if="editList">
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

          <Flex class="gap-3" align-center>
            <Button @click="selectList(undefined)" icon="a" text rounded
                    severity="secondary" style="flex: 0 0 auto;">
              <Icon :src="icon_chevron_left" />
            </Button>

            <!-- TODO: fix this direct modification -->
            <InputText v-model="editList.label" fluid />
          </Flex>

          <!-- TODO: fix this direct modification -->
          <Textarea v-model="editList.notes" auto-resize />

          <span>total: {{ listWeight }}g</span>

          <Flex grow column>
            <template v-for="category in listCategories">
              <Flex align-baseline v-if="category.name">
                <h3>{{ category.name }}</h3>

                <span>{{ category.weight }}g</span>
              </Flex>

              <template v-for="{ item, count } in category.items">
                <Flex class="px-2 item active" align-center>
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
            <Flex class="gap-3">
              <Button type="button"
                      @click="startAddList">

                <Icon :src="icon_add"
                      style="margin: -10em 0" />
                Add List
              </Button>
            </Flex>

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
            </Flex>
          </Flex>
        </template>
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
import { Button, Checkbox, Dialog, InputText, Menu, Select, Textarea, ToggleButton } from 'primevue';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref, shallowReactive, shallowRef, useTemplateRef } from 'vue';
import { ADD_ITEM, assert, DELETE_ITEM, UPDATE_ITEM, type List, type Item, clone, ADD_LIST_ITEM, REMOVE_LIST_ITEM, ADD_LIST, DELETE_LIST } from 'packtrack-common';
import ItemEditor from './ui/ItemEditor.vue';
import { library } from './localStorage';
import { icon_add, icon_chevron_left, icon_close, icon_delete, icon_edit, icon_save, icon_visibility, icon_visibility_off } from './assets/symbols';
import Flex from './ui/Flex.vue';
import Icon from './ui/Icon.vue';

const showUsedItems = shallowRef(false);
const addListMenu = useTemplateRef('addListMenu');

const addListOptions = computed<MenuItem[]>(() => {
  if (!editList.value) return [];
  return Object.values(library.lists)
    .filter(l => l != editList.value)
    .map(v => ({
      label: v.label,
      command: () => includeList(v),
    }));
})

const createItem = shallowRef<Item>();
const editItem = shallowRef<Item>();

const editList = ref<List>();

function addItem(item: Item) {
  assert(!!editList.value, 'invalid add item');
  ADD_LIST_ITEM.impl(library, editList.value.id, item.id);
}

function removeItem(item: Item) {
  assert(!!editList.value, 'invalid remove item');
  REMOVE_LIST_ITEM.impl(library, editList.value.id, item.id);
}

function includeList(list: List) {
  assert(!!editList.value, 'invalid include list');
  // TODO optimize this
  for (const entry of list.items) {
    for (let i = 0; i < entry.count; ++i) {
      ADD_LIST_ITEM.impl(library, editList.value.id, entry.itemId);
    }
  }
}

function selectList(list: List | undefined) {
  editList.value = list;
}

function deleteList() {
  assert(!!editList.value, 'invalid delete list');
  DELETE_LIST.impl(library, editList.value.id);
  editList.value = undefined;
}

function getListWeight(list: List) {
  const weight = list.items
    .map(e => (library.items[e.itemId]!.weight ?? 0) * e.count)
    .reduce((a, b) => a + b, 0);

  return weight;
}

const lists = computed(() => Object.values(library.lists)
  .map(list => {
    const weight = getListWeight(list);

    return { list, weight };
  }));

const listWeight = computed(() => editList.value && getListWeight(editList.value));

const listCategories = computed(() => {
  return editList.value && [...new Set(editList.value.items
    .map(i => library.items[i.itemId]!)
    .map(i => i.category ?? ''))]
    .sort((a, b) => a?.localeCompare(b))
    .map(name => {
      const items = editList.value!.items
        .map(i => ({ item: library.items[i.itemId]!, count: i.count }))
        .filter(e => e.count > 0 && (e.item.category ?? '') == name)
        .sort((a, b) => (a.item.category ?? '').localeCompare(b.item.category ?? '')
          || a.item.label.localeCompare(b.item.label));

      const weight = items
        .map(e => (e.item.weight ?? 0) * e.count)
        .reduce((a, b) => a + b, 0);

      return { name, items, weight };
    })
});

const visibleItems = computed(() => Object.values(library.items)
  .filter(i => showUsedItems.value || !editList.value || !editList.value.items.some(e => e.itemId == i.id)));

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

const categoryValue = shallowRef('');
function isValidCategory(category: string) {
  return category.trim().length > 0 && category.trim().length < 1024
}

function applyCategory() {
  for (const item of selected) {
    const update = clone(item);
    if (!categoryValue.value) {
      delete update.category;
    } else {
      update.category = categoryValue.value;
    }
    UPDATE_ITEM.impl(library, update);
  }
}

const selected = shallowReactive(new Set<Item>());
function toggleSelected(item: Item) {
  if (!selected.delete(item)) {
    selected.add(item)
  }
}

function startAddItem() {
  createItem.value = {
    id: 0,
    label: '',
  };
}

function startEditItem(item: Item) {
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

function startAddList() {
  const now = new Date();

  const id = library.nextId;

  ADD_LIST.impl(library, {
    id: 0,
    label: `${now.getFullYear()}-${now.getMonth().toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
    items: [],
  });

  editList.value = library.lists[id];
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
</style>
