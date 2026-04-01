<template>
  <div class="app">
    <InputText v-model="input" class="ma-3" @keyup.enter="onSubmit" autofocus />

    <Flex column>
      <template v-for="item in items">
        <Flex class="px-3 item" align-center
              @click="startEdit(item)"
              @touchstart="() => { /* needed for mobile to show click effects */ }">
          <span>{{ item.label }}</span>
          <span v-if="item.weight">{{ item.weight }}g</span>
          <span v-else>&nbsp;</span>
          <span v-if="item.notes">{{ item.notes }}</span>
          <span v-else>&nbsp;</span>
        </Flex>
      </template>
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
import { Dialog, InputText } from 'primevue';
import { computed, shallowRef } from 'vue';
import ItemEditor from './ui/ItemEditor.vue';
import { ADD_ITEM, assert, DELETE_ITEM, UPDATE_ITEM, type Item } from 'packtrack-common';
import Flex from './ui/Flex.vue';
import { library } from './localStorage';

const input = shallowRef('');

const createItem = shallowRef<Item>();
const editItem = shallowRef<Item>();

const items = computed(() => {
  return Object.values(library.items)
    .sort((a, b) => a.label.localeCompare(b.label))
    .filter(a => a.label.toLowerCase().includes(input.value.toLowerCase()));
});

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

.item {
  height: 2.25rem;
  margin: 0 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);
  @include interactive-list-item;

  > span:nth-child(1) {
    flex: 2 0 0;
  }

  > span:nth-child(2) {
    flex: 1 0 0;
  }

  > span:nth-child(3) {
    flex: 8 0 0;
  }
}
</style>
