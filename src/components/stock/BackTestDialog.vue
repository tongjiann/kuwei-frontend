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

    <!-- 汇总 -->
    <div v-if="activeIndex === 'summary'">
      <v-chart :option="summaryOption" style="height: 520px" />
    </div>

    <!-- 单策略 -->
    <div v-else>
      <!-- ✅ 基础信息 -->
      <el-row :gutter="16" class="mb-4">
        <el-col :span="4">
          <Card title="初始资金" :value="formatNumber(current.startAsset ?? current.initialAsset)" />
        </el-col>

        <el-col :span="4">
          <Card title="结束资金" :value="formatNumber(current.endAsset ?? current.finalAsset)" />
        </el-col>

        <el-col :span="4">
          <Card title="收益率" :value="formatPercent(current.returnRate)" />
        </el-col>

        <el-col :span="4">
          <Card title="最大回撤" :value="formatPercent(current.maxDrawDown)" />
        </el-col>

        <el-col :span="4">
          <Card title="夏普率" :value="formatNumber(current.sharpeRatio)" />
        </el-col>
      </el-row>

      <v-chart :option="option" style="height: 520px" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElDialog, ElTabs, ElTabPane, ElRow, ElCol } from 'element-plus'
import VChart from 'vue-echarts'

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

/** ✅ tab 统一使用 string */
const activeIndex = ref('summary')

/** ✅ 核心修复：强制转 number */
const current = computed(() => {
  if (activeIndex.value === 'summary') return {}

  const idx = Number(activeIndex.value)
  return props.data?.[idx] || {}
})

/* ================= 汇总 ================= */
const summaryOption = computed(() => {
  if (!props.data?.length) return {}

  const dates = props.data[0].portfolioDailyRecordList.map(r => r.date)
  const len = dates.length

  const strategySeries = props.data.map(item => ({
    name: '[策]' + item.strategy,
    type: 'line',
    data: item.portfolioDailyRecordList.map(r => r.totalAsset / (item.startAsset ?? item.initialAsset)),
    smooth: true
  }))

  const stockMap = {}

  props.data.forEach(item => {
    item.portfolioDailyRecordList.forEach((r, idx) => {
      Object.values(r.positionMap || {}).forEach(p => {
        if (!stockMap[p.code]) {
          stockMap[p.code] = {
            base: null,
            list: new Array(len).fill(null)
          }
        }
        if (stockMap[p.code].base == null) {
          stockMap[p.code].base = p.price
        }
        stockMap[p.code].name = p.name
        stockMap[p.code].list[idx] = p.price / stockMap[p.code].base
      })
    })
  })

  const stockSeries = Object.keys(stockMap).map(code => ({
    name: '[股]' + stockMap[code].name + '-' + code,
    type: 'line',
    data: stockMap[code].list,
    smooth: true,
    lineStyle: { type: 'dashed', opacity: 0.5 }
  }))

  /** ✅ 默认全部显示 */
  const legendSelected = {}
  props.data.forEach(item => (legendSelected[item.strategy] = true))
  Object.keys(stockMap).forEach(code => (legendSelected[code] = true))

  return {
    legend: {
      type: 'scroll',
      selected: legendSelected
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },

      formatter: params => {
        if (!params || !params.length) return ''

        /** ✅ 按 value 排序（从大到小） */
        const sorted = [...params].sort((a, b) => {
          const va = a.value ?? -Infinity
          const vb = b.value ?? -Infinity
          return vb - va
        })

        let html = `<b>${sorted[0].axisValue}</b><br/>`

        sorted.forEach(p => {
          if (p.value == null) return

          html += `${p.marker}${p.seriesName}: ${Number(p.value).toFixed(2)}<br/>`
        })

        return html
      }
    },

    xAxis: { type: 'category', data: dates },

    yAxis: [{ type: 'value', name: '收益率' }],

    series: [...strategySeries, ...stockSeries]
  }
})

/* ================= 单策略 ================= */
const option = computed(() => {
  const r = current.value
  if (!r?.portfolioDailyRecordList) return {}

  const dates = []
  const total = []
  const cash = []
  const pos = []

  const stockCodePriceMap = {}
  const stockCodeNameMap = {}

  r.portfolioDailyRecordList.forEach((d, i) => {
    dates.push(d.date)
    total.push(d.totalAsset)
    cash.push(d.cash)
    pos.push(d.totalPositionValue)

    Object.values(d.positionMap || {}).forEach(p => {
      if (!stockCodePriceMap[p.code]) {
        stockCodePriceMap[p.code] = []
      }
      /** ✅ 直接用价格 */
      stockCodePriceMap[p.code][i] = p.price
      stockCodeNameMap[p.code] = p.name
    })
  })

  /** 股票 series（绑定价格轴） */
  const stockSeries = Object.keys(stockCodePriceMap).map(code => ({
    name: '[股]' + stockCodeNameMap[code] + '-' + code,
    type: 'line',
    data: stockCodePriceMap[code],
    smooth: true,
    yAxisIndex: 1, // ✅ 关键：使用第二个Y轴
    lineStyle: { opacity: 0.7 }
  }))

  const legendSelected = {
    总资产: true,
    现金: true,
    持仓: true
  }
  Object.keys(stockCodePriceMap).forEach(code => (legendSelected[code] = true))

  return {
    legend: {
      type: 'scroll',
      selected: legendSelected
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' }
    },

    xAxis: {
      type: 'category',
      data: dates
    },

    /** ✅ 双Y轴 */
    yAxis: [
      {
        type: 'value',
        name: '资产'
      },
      {
        type: 'value',
        position: 'right',

        /** ✅ 完全隐藏右侧轴 */
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      }
    ],

    series: [
      {
        name: '[信]总资产',
        type: 'line',
        data: total,
        yAxisIndex: 0
      },
      {
        name: '[信]现金',
        type: 'line',
        data: cash,
        yAxisIndex: 0
      },
      {
        name: '[信]持仓',
        type: 'line',
        data: pos,
        yAxisIndex: 0
      },
      ...stockSeries
    ]
  }
})

/* ================= 工具方法 ================= */
function formatPercent(v) {
  if (v == null || isNaN(v)) return '-'
  return (Number(v) * 100).toFixed(2) + '%'
}

function formatNumber(v) {
  if (v == null || isNaN(v)) return '-'
  return Number(v).toFixed(2)
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
