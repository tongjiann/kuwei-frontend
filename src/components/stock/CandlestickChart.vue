<template>
  <div ref="chartRef" class="kline-chart" :style="{ width, height }" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { nextTick } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  titlePrefix: {
    type: String,
    default: ''
  },
  width: { type: String, default: '100%' },
  height: { type: String, default: '600px' },
  showVolume: { type: Boolean, default: false }
})

const chartRef = ref(null)
let chartInstance = null

// 数据转换
const transformData = () => {
  if (!Array.isArray(props.data) || props.data.length === 0) {
    return { dates: [], klineValues: [], volumes: [] }
  }

  const dates = props.data.map(item => item.date)
  const klineValues = props.data.map(item => [
    item.openPrice,
    item.todayClosePrice,
    item.highPrice,
    item.lowPrice,
    item.yesterdayClosePrice
  ])
  const volumes = props.data.map(item => item.turnover || 0)

  return { dates, klineValues, volumes }
}

// 构建配置
const buildOption = () => {
  const { dates, klineValues, volumes } = transformData()
  if (dates.length === 0) return {}

  const hasVolume = props.showVolume

  const option = {
    title: {
      text: props.titlePrefix + (hasVolume ? ' K线图（带成交量）' : ' K线图'),
      left: 'center'
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: params => {
        const d = props.data[params[0].dataIndex]
        if (!d) return ''

        const formatNum = (val, digit = 2) => {
          const num = Number(val)
          return isFinite(num) ? num.toFixed(digit) : '--'
        }

        const calcChange = (close, preClose) => {
          const c = Number(close)
          const p = Number(preClose)

          if (!isFinite(c) || !isFinite(p) || p === 0) {
            return { change: '--', percent: '--', color: '#999' }
          }

          const diff = c - p
          const percent = ((diff / p) * 100).toFixed(2)

          return {
            change: diff.toFixed(2),
            percent,
            color: diff >= 0 ? '#ff4d4f' : '#3a8c3e'
          }
        }

        const { change, percent, color } = calcChange(d.todayClosePrice, d.yesterdayClosePrice)

        return `
    <div>
      <div>${d.date || '--'}</div>
      <div style="color:${color}">
        涨跌：${change} (${percent}%)
      </div>
      <div>开：${formatNum(d.openPrice)}</div>
      <div>收：${formatNum(d.todayClosePrice)}</div>
      <div>高：${formatNum(d.highPrice)}</div>
      <div>低：${formatNum(d.lowPrice)}</div>
      ${props.showVolume ? `<div>量：${formatNum(d.turnover, 0)}</div>` : ''}
    </div>
  `
      }
    },

    // 👇 双 grid（核心）
    grid: hasVolume
      ? [
          { left: '10%', right: '8%', top: '10%', height: '55%' },
          { left: '10%', right: '8%', top: '70%', height: '20%' }
        ]
      : [{ left: '10%', right: '8%', top: '10%', bottom: '15%' }],

    // 👇 双 xAxis
    xAxis: hasVolume
      ? [
          {
            type: 'category',
            data: dates,
            boundaryGap: true,
            axisLine: { onZero: false },
            splitLine: { show: false },
            axisLabel: { show: false }
          },
          {
            type: 'category',
            gridIndex: 1,
            data: dates,
            boundaryGap: true,
            axisLine: { onZero: false },
            axisLabel: { rotate: 45 }
          }
        ]
      : [
          {
            type: 'category',
            data: dates,
            axisLabel: { rotate: 45 }
          }
        ],

    // 👇 双 yAxis
    yAxis: hasVolume
      ? [
          {
            scale: true,
            gridIndex: 0,
            name: '价格'
          },
          {
            scale: true,
            gridIndex: 1,
            name: '成交量'
          }
        ]
      : [{ scale: true, name: '价格' }],

    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: hasVolume ? [0, 1] : [0],
        start: 50,
        end: 100
      },
      {
        type: 'slider',
        xAxisIndex: hasVolume ? [0, 1] : [0],
        start: 50,
        end: 100
      }
    ],

    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineValues,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          color: '#ff4d4f',
          color0: '#3a8c3e',
          borderColor: '#ff4d4f',
          borderColor0: '#3a8c3e'
        }
      }
    ]
  }

  // 👇 成交量（独立区域）
  if (hasVolume) {
    option.series.push({
      name: '成交量',
      type: 'bar',
      data: volumes,
      xAxisIndex: 1,
      yAxisIndex: 1,
      barWidth: '60%',
      itemStyle: {
        color: params => {
          const d = props.data[params.dataIndex]
          if (!d) return '#87d068'
          return d.todayClosePrice >= d.openPrice ? '#ff4d4f' : '#3a8c3e'
        }
      }
    })
  }

  return option
}

// 初始化
const initChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  chartInstance.setOption(buildOption(), true)
}

// 监听数据变化
watch(
  () => props.data,
  () => {
    if (chartInstance) {
      chartInstance.setOption(buildOption(), true)
    }
  },
  { deep: true }
)

// resize
const resize = () => {
  chartInstance?.resize()
}

// 👇 暴露给父组件（解决dialog问题）
defineExpose({
  resize
})

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  tryInitChart()
  window.addEventListener('resize', handleResize)
})

const tryInitChart = async () => {
  await nextTick()

  const el = chartRef.value
  if (!el) return

  // 👇 关键：确保有宽高
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    // 延迟再试（避免 dialog 未完全展开）
    setTimeout(tryInitChart, 100)
    return
  }

  initChart()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.kline-chart {
  width: 100%;
  height: 100%;
}
</style>
