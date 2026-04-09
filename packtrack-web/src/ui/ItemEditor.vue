<template>
  <Flex column class="mt-3 gap-3">
    <Flex class="gap-3">
      <FloatLabel variant="on">
        <InputText id="item-label" v-model="newItem.label" autofocus
                   @keyup.enter="onSubmit" />
        <label for="item-label">Label</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputNumber id="item-weight" v-model="newItem.weight"
                     @keyup.enter="onSubmit" />
        <label for="item-weight">Weight</label>
      </FloatLabel>
    </Flex>

    <FloatLabel variant="on">
      <InputText id="item-notes" v-model="newItem.notes" fluid
                 @keyup.enter="onSubmit" />
      <label for="item-notes">Notes</label>
    </FloatLabel>

    <Flex>
      <template v-if="canDelete">
        <Button @click="doDelete" severity="danger">
          <Icon :src="icon_delete" />
          Delete
        </Button>
      </template>

      <Flex grow />

      <Button @click="save" :disabled="!isValidItem(newItem)">
        <Icon :src="icon_save" />
        Save
      </Button>
    </Flex>
  </Flex>
</template>

<script setup lang="ts">
import { Button, FloatLabel, InputNumber, InputText } from 'primevue';
import { clone, isValidItem, type Item } from 'packtrack-common'
import { icon_delete, icon_save } from '@/assets/symbols';
import Flex from './Flex.vue';
import Icon from './Icon.vue';
import { computed, reactive, watchEffect } from 'vue';

const props = defineProps<{
  modelValue: Item,
}>();

const emit = defineEmits<{
  'update:modelValue': [Item],
  'delete': [],
}>();

const newItem = reactive(clone<Item>(props.modelValue));

const canDelete = computed(() => props.modelValue.id !== 0);

function save() {
  emit('update:modelValue', newItem);
}

function doDelete() {
  emit('delete');
}

function onSubmit(e: KeyboardEvent) {
  save();
}

watchEffect(() => { if (!newItem.weight) delete newItem.weight; });
watchEffect(() => { if (!newItem.notes) delete newItem.notes; });
</script>

<style scoped lang="scss"></style>
