<template>
  <el-dialog
    v-model="visible"
    width="95%"
    top="5vh"
    :center="true"
    @closed="contentReady = false"
    @opened="handleOpened"
  >
    <template #header>
      <div class="dialog-header">
        <el-tabs v-model="activeIndex" :stretch="true">
          <el-tab-pane label="汇总" name="summary" />
          <el-tab-pane
            v-for="(item, idx) in data"
            :key="idx"
            :label="item.strategy || `策略${idx + 1}`"
            :name="String(idx)"
          />
        </el-tabs>
      </div>
    </template>

    <SummaryChart v-if="contentReady && activeIndex === 'summary'" :data="data" />

    <StrategyDetail v-if="contentReady && activeIndex !== 'summary'" :data="data[Number(activeIndex)]" />
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import SummaryChart from './SummaryChart.vue'
import StrategyDetail from './StrategyDetail.vue'

const props = defineProps({
  modelValue: Boolean,
  data: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'open'])

const visible = ref(props.modelValue)
const contentReady = ref(false)

watch(
  () => props.modelValue,
  v => (visible.value = v)
)
watch(visible, v => emit('update:modelValue', v))

const activeIndex = ref('summary')

function handleOpened() {
  contentReady.value = true
  emit('open')
}
</script>
<style lang="css">
.dialog-header {
  padding-right: 40px; /* 给关闭按钮留空间 */
}
</style>
