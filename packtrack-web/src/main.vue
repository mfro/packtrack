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
            <Flex class="px-3 item" align-center>

              <label :for="`item-${item.id}`"
                     class="item-checkbox">
                <Checkbox :inputId="`item-${item.id}`" binary
                          :model-value="selected.has(item)"
                          @update:model-value="toggleSelected(item)" />
              </label>

              <Flex class="px-3" align-center grow
                    @click="startEdit(item)"
                    @touchstart="() => { /* needed for mobile to show click effects */ }">

                <span>{{ item.label }}</span>
                <!-- <span v-if="item.category">{{ item.category }}</span>
                <span v-else>&nbsp;</span> -->
                <span v-if="item.weight">{{ item.weight }}g</span>
                <span v-else>&nbsp;</span>
                <span v-if="item.notes">{{ item.notes }}</span>
                <span v-else>&nbsp;</span>
              </Flex>
            </Flex>
          </template>
        </template>
      </Flex>

      <Flex grow column>
        <template v-for="category in categories">
          <Flex class="px-3 category" align-center>
            <span>{{ category.name }}</span>
            <span>{{ category.weight }}g</span>
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
import { Button, Checkbox, Dialog, InputText, Select } from 'primevue';
import { computed, shallowReactive, shallowRef } from 'vue';
import { ADD_ITEM, assert, DELETE_ITEM, UPDATE_ITEM, type Item } from 'packtrack-common';
import ItemEditor from './ui/ItemEditor.vue';
import { library } from './localStorage';
import { icon_close, icon_save } from './assets/symbols';
import Flex from './ui/Flex.vue';
import Icon from './ui/Icon.vue';

const input = shallowRef('');

const createItem = shallowRef<Item>();
const editItem = shallowRef<Item>();

const items = computed(() => {
  return Object.values(library.items)
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '')
      || a.label.localeCompare(b.label))
    .filter(a => a.label.toLowerCase().includes(input.value.toLowerCase()));
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
  if (e.ctrlKey) {
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
    height: var(--p-button-icon-only-width);
    margin: -100px 0;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center
  }

  > :nth-child(2) {
    height: 2.25rem;
    padding: 0.5rem 0.5rem;
    border-radius: var(--p-border-radius-md);
    @include interactive-list-item;

    > span:nth-child(1) {
      flex: 5 0 0;
    }

    > span:nth-child(2) {
      flex: 2 0 0;
    }

    > span:nth-child(3) {
      flex: 13 0 0;
    }
  }
}

.category {
  max-width: 20rem;

  height: 2.25rem;
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
