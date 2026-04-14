<template>
  <el-dialog v-model="visible" width="95%" top="5vh" @opened="onDialogOpened">
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
      <v-chart ref="summaryChartRef" :option="summaryOption" style="height: 520px" autoresize />
    </div>

    <!-- 单策略 -->
    <div v-else>
      <el-row :gutter="16" class="mb-4">
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

      <v-chart ref="detailChartRef" :option="option" style="height: 520px" autoresize />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElDialog, ElTabs, ElTabPane, ElRow, ElCol } from 'element-plus'
import VChart from 'vue-echarts'

const props = defineProps({
  modelValue: Boolean,
  data: Array
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const summaryChartRef = ref(null)
const detailChartRef = ref(null)

watch(
  () => props.modelValue,
  v => (visible.value = v)
)
watch(visible, v => emit('update:modelValue', v))

const activeIndex = ref('summary')

// dialog 动画结束后强制 resize，解决首次宽度异常
function onDialogOpened() {
  nextTick(() => {
    summaryChartRef.value?.resize()
    detailChartRef.value?.resize()
  })
}

// 切换 tab 时也 resize，防止从汇总切到单策略时异常
watch(activeIndex, () => {
  nextTick(() => {
    summaryChartRef.value?.resize()
    detailChartRef.value?.resize()
  })
})

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
          stockMap[p.code] = { base: null, list: new Array(len).fill(null) }
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

  const legendSelected = {}
  props.data.forEach(item => (legendSelected[item.strategy] = true))
  Object.keys(stockMap).forEach(code => (legendSelected[code] = true))

  return {
    legend: { type: 'scroll', selected: legendSelected },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: params => {
        if (!params?.length) return ''
        const sorted = [...params].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
        let html = `<b>${sorted[0].axisValue}</b><br/>`
        sorted.forEach(p => {
          if (p.value == null) return
          html += `${p.marker}${p.seriesName}: ${Number(p.value).toFixed(2)}<br/>`
        })
        return html
      }
    },
    xAxis: { type: 'category', data: dates },
    yAxis: [{ type: 'value', name: '收益率', scale: true }],
    dataZoom: [
      {
        type: 'inside', // 鼠标滚轮 / 触控板双指缩放
        xAxisIndex: 0,
        start: 0,
        end: 100
      },
      {
        type: 'slider', // 底部拖拽条，可视化选择区间
        xAxisIndex: 0,
        start: 0,
        end: 100
      }
    ],
    series: [...strategySeries, ...stockSeries]
  }
})

/* ================= 单策略 ================= */
const option = computed(() => {
  const r = current.value
  if (!r?.portfolioDailyRecordList) return {}

  const dates = [],
    total = [],
    cash = [],
    pos = []
  const stockCodePriceMap = {},
    stockCodeNameMap = {},
    stockBasePriceMap = {}

  r.portfolioDailyRecordList.forEach((d, i) => {
    dates.push(d.date)
    total.push(d.totalAsset)
    cash.push(d.cash)
    pos.push(d.totalPositionValue)

    Object.values(d.positionMap || {}).forEach(p => {
      if (!stockCodePriceMap[p.code]) stockCodePriceMap[p.code] = []
      if (stockBasePriceMap[p.code] == null) stockBasePriceMap[p.code] = p.price
      stockCodePriceMap[p.code][i] = p.price
      stockCodeNameMap[p.code] = p.name
    })
  })

  const stockSeries = Object.keys(stockCodePriceMap).map(code => ({
    name: '[股]' + stockCodeNameMap[code] + '-' + code,
    type: 'line',
    data: stockCodePriceMap[code],
    smooth: true,
    yAxisIndex: 1,
    lineStyle: { opacity: 0.7 }
  }))

  const legendSelected = { 总资产: true, 现金: true, 持仓: true }
  Object.keys(stockCodePriceMap).forEach(code => (legendSelected[code] = true))

  return {
    legend: { type: 'scroll', selected: legendSelected },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: params => {
        if (!params?.length) return ''
        const sorted = [...params].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
        let html = `<b>${sorted[0].axisValue}</b><br/>`
        sorted.forEach(p => {
          if (p.value == null) return
          const name = p.seriesName
          if (name.startsWith('[股]')) {
            const code = name.split('-').pop()
            const base = stockBasePriceMap[code]
            const rate = base && p.value ? ((p.value / base - 1) * 100).toFixed(2) + '%' : '-'
            html += `${p.marker}${name}: ${Number(p.value).toFixed(2)} (${rate})<br/>`
          } else {
            html += `${p.marker}${name}: ${Number(p.value).toFixed(2)}<br/>`
          }
        })
        return html
      }
    },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: '资产', scale: true },
      {
        type: 'value',
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside', // 鼠标滚轮 / 触控板双指缩放
        xAxisIndex: 0,
        start: 0,
        end: 100
      },
      {
        type: 'slider', // 底部拖拽条，可视化选择区间
        xAxisIndex: 0,
        start: 0,
        end: 100
      }
    ],
    series: [
      { name: '[信]总资产', type: 'line', data: total, yAxisIndex: 0 },
      { name: '[信]现金', type: 'line', data: cash, yAxisIndex: 0 },
      { name: '[信]持仓', type: 'line', data: pos, yAxisIndex: 0 },
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

<script>
export const Card = {
  props: ['title', 'value'],
  template: `
    <div style="padding:12px;border-radius:10px;background:rgb( 90,156,248,0.2)">
      <div style="font-size:12px;">{{ title }}</div>
      <div style="font-size:18px;font-weight:bold">{{ value || '-' }}</div>
    </div>
  `
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
