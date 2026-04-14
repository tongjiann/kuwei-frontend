<template>
  <v-chart ref="chartRef" :option="option" style="height: 520px" autoresize />
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps({
  data: Array
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

  return {
    legend: { type: 'scroll' },
    tooltip: {
      trigger: 'axis',
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
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    series: [...strategySeries, ...stockSeries]
  }
})
</script>
