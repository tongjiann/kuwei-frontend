<template>
  <el-dialog v-model="visible" width="95%" top="5vh">
    <template #header>
      <el-tabs v-model="activeIndex" :stretch="true">
        <el-tab-pane label="汇总" name="summary" />
        <el-tab-pane
          v-for="(item, idx) in data"
          :key="idx"
          :label="item.strategy || `策略${idx + 1}`"
          :name="String(idx)"
        />
      </el-tabs>
    </template>

    <SummaryChart v-if="activeIndex === 'summary'" :data="data" />

    <StrategyDetail v-else :data="data[Number(activeIndex)]" />
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import SummaryChart from './SummaryChart.vue'
import StrategyDetail from './StrategyDetail.vue'

const props = defineProps({
  modelValue: Boolean,
  data: Array
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
watch(
  () => props.modelValue,
  v => (visible.value = v)
)
watch(visible, v => emit('update:modelValue', v))

const activeIndex = ref('summary')
</script>
