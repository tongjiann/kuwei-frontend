<template>
  <el-row :gutter="16" class="mb-4">
    <el-col :span="4">
      <Card title="收益率" :value="formatPercent(data.returnRate)" />
    </el-col>
    <el-col :span="4">
      <Card title="最大回撤" :value="formatPercent(data.maxDrawDown)" />
    </el-col>
    <el-col :span="4">
      <Card title="夏普率" :value="formatNumber(data.sharpeRatio)" />
    </el-col>
  </el-row>

  <v-chart ref="chartRef" :option="option" style="height: 520px" autoresize />
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps({
  data: Object
})

const chartRef = ref(null)

watch(
  () => props.data,
  () => {
    nextTick(() => chartRef.value?.resize())
  },
  { deep: true }
)

const option = computed(() => {
  const r = props.data
  if (!r?.portfolioDailyRecordList) return {}

  const dates = [],
    total = [],
    cash = [],
    pos = []

  const stockMap = {}
  const baseMap = {}

  r.portfolioDailyRecordList.forEach((d, i) => {
    dates.push(d.date)
    total.push(d.totalAsset)
    cash.push(d.cash)
    pos.push(d.totalPositionValue)

    Object.values(d.positionMap || {}).forEach(p => {
      if (!stockMap[p.code]) stockMap[p.code] = []
      if (baseMap[p.code] == null) baseMap[p.code] = p.price
      stockMap[p.code][i] = p.price
    })
  })

  const stockSeries = Object.keys(stockMap).map(code => ({
    name: '[股]' + code,
    type: 'line',
    data: stockMap[code],
    yAxisIndex: 1
  }))

  return {
    legend: { type: 'scroll' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: '资产' },
      { type: 'value', position: 'right', show: false }
    ],
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    series: [
      { name: '总资产', type: 'line', data: total },
      { name: '现金', type: 'line', data: cash },
      { name: '持仓', type: 'line', data: pos },
      ...stockSeries
    ]
  }
})

function formatPercent(v) {
  if (v == null || isNaN(v)) return '-'
  return (Number(v) * 100).toFixed(2) + '%'
}

function formatNumber(v) {
  if (v == null || isNaN(v)) return '-'
  return Number(v).toFixed(2)
}
</script>
