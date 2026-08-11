<template>
  <div ref="chartRef" class="kline-chart" />
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
  showVolume: { type: Boolean, default: false },
  volumeProfile: {
    type: Object,
    default: null
  },
  trendPriceLevels: {
    type: Object,
    default: null
  },
  trendPriceOverlayEnabled: {
    type: Boolean,
    default: false
  },
  volumeProfileWidthPercent: {
    type: Number,
    default: 15
  },
  initialRange: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['range-change'])

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

// 有效成交量分布：存在且含价格档数据
const getProfile = () => {
  const p = props.volumeProfile
  if (!p || !Array.isArray(p.levels) || p.levels.length === 0) {
    return null
  }
  return p
}

const getTrendPriceLevels = () => {
  const analysis = props.trendPriceLevels
  if (!analysis) return null
  return {
    ...analysis,
    trendLines: Array.isArray(analysis.trendLines) ? analysis.trendLines : [],
    frequentLevels: Array.isArray(analysis.frequentLevels) ? analysis.frequentLevels : []
  }
}

const isValidPrice = value => Number.isFinite(Number(value))

const formatOverlayPrice = value =>
  Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4, useGrouping: false })

const CLOSE_LEVEL_GAP_RATIO = 0.035
const LEVEL_LABEL_STAGGER_PX = 18
const LEVEL_LABEL_X_OFFSET = 8
const POC_LINE_COLOR = '#7c3aed'
const POC_LINE_WIDTH = 3

const buildFrequentLevelLabelLayouts = analysis => {
  const priceLow = Number(analysis?.priceLow)
  const priceHigh = Number(analysis?.priceHigh)
  const priceSpan = priceHigh - priceLow
  const minimumGap = Number.isFinite(priceSpan) && priceSpan > 0 ? priceSpan * CLOSE_LEVEL_GAP_RATIO : 0
  const layouts = new Map()
  const sortedLevels = analysis.frequentLevels
    .map((level, index) => ({ level, index, price: Number(level.price) }))
    .filter(item => Number.isFinite(item.price))
    .sort((left, right) => left.price - right.price)
  let cluster = []

  const flushCluster = () => {
    if (!cluster.length) return
    const center = (cluster.length - 1) / 2
    cluster.forEach((item, position) => {
      const verticalOffset = Math.round((center - position) * LEVEL_LABEL_STAGGER_PX)
      layouts.set(item.index, {
        position: 'end',
        offset: [LEVEL_LABEL_X_OFFSET, verticalOffset]
      })
    })
    cluster = []
  }

  sortedLevels.forEach(item => {
    const previous = cluster[cluster.length - 1]
    if (previous && item.price - previous.price > minimumGap) {
      flushCluster()
    }
    cluster.push(item)
  })
  flushCluster()
  return layouts
}

// 价格档最大成交量（横向直方图 x 轴上限）
const getProfileMaxVolume = profile => {
  let max = 0
  profile.levels.forEach(level => {
    const total = Number(level.totalVolume) || 0
    if (total > max) max = total
  })
  return max || 1
}

// 横向直方图 x 轴上限：让最宽档位占整个图表宽度的 volumeProfileWidthPercent%（默认 15%，范围 5%~20%）
const getProfileAxisMax = (profile, grid) => {
  const maxVolume = getProfileMaxVolume(profile)
  const grid0 = Array.isArray(grid) ? grid[0] : grid
  const leftPct = parseFloat(grid0 && grid0.left) || 10
  const rightPct = parseFloat(grid0 && grid0.right) || 8
  const gridWidthPct = 100 - leftPct - rightPct
  const widthPercent = Math.min(20, Math.max(5, Number(props.volumeProfileWidthPercent) || 15))
  return maxVolume * (gridWidthPct / widthPercent)
}

// 构建配置
const buildOption = () => {
  const { dates, klineValues, volumes } = transformData()
  if (dates.length === 0) return {}

  const hasVolume = props.showVolume
  const profile = getProfile()
  const hasProfile = !!profile
  const trendPriceAnalysis = getTrendPriceLevels()
  const hasTrendPriceAnalysis = props.trendPriceOverlayEnabled
  const zoom = getZoomState()

  const option = {
    title: {
      text:
        props.titlePrefix +
        (hasVolume ? ' K线图（带成交量）' : ' K线图') +
        (hasProfile ? ' · 成交量分布' : '') +
        (hasTrendPriceAnalysis ? ' · 趋势线/价位' : ''),
      left: 'center'
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: params => {
        const candle = params.find(item => item.seriesType === 'candlestick') || params[0]
        const d = props.data[candle ? candle.dataIndex : 0]
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
          { left: '10%', right: '18%', top: '10%', height: '55%' },
          { left: '10%', right: '18%', top: '70%', height: '20%' }
        ]
      : [{ left: '10%', right: '18%', top: '10%', bottom: '15%' }],

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
        start: zoom.start,
        end: zoom.end
      },
      {
        type: 'slider',
        xAxisIndex: hasVolume ? [0, 1] : [0],
        start: zoom.start,
        end: zoom.end
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

  // 👇 自动锚定成交量分布：价格 grid 内左侧横向直方图 + POC/VAH/VAL
  if (hasProfile) {
    const vah = Number(profile.valueAreaHigh)
    const val = Number(profile.valueAreaLow)
    const poc = Number(profile.pocPrice)
    const candleSeries = option.series[0]

    // 价值区域背景
    if (isFinite(val) && isFinite(vah)) {
      candleSeries.markArea = {
        silent: true,
        itemStyle: { color: 'rgba(144, 147, 153, 0.12)' },
        data: [[{ yAxis: val }, { yAxis: vah }]]
      }
    }

    // POC 使用醒目实线，VAH / VAL 保持普通虚线
    const markLineData = []
    if (isFinite(vah)) markLineData.push({ yAxis: vah, name: 'VAH' })
    if (isFinite(poc)) {
      markLineData.push({
        yAxis: poc,
        name: 'POC',
        lineStyle: { color: POC_LINE_COLOR, width: POC_LINE_WIDTH, type: 'solid' },
        label: { color: POC_LINE_COLOR, fontWeight: 'bold' }
      })
    }
    if (isFinite(val)) markLineData.push({ yAxis: val, name: 'VAL' })
    if (markLineData.length) {
      candleSeries.markLine = {
        symbol: 'none',
        silent: true,
        label: {
          show: true,
          position: 'end',
          align: 'left',
          offset: [LEVEL_LABEL_X_OFFSET, 0],
          fontSize: 11,
          formatter: params => `${params.name}: ${Number(params.value).toFixed(2)}`
        },
        lineStyle: { type: 'dashed', width: 1, color: '#909399' },
        data: markLineData
      }
    }

    // 价格 grid 内追加隐藏 value 轴，作为横向直方图的 x 轴（不参与 dataZoom）
    // inverse：x=0 位于右边缘，直方图从右向左延伸（TradingView 风格）
    // 兜底：调用方可能把 xAxis 配置成单对象，统一转成数组后再追加
    if (!Array.isArray(option.xAxis)) option.xAxis = [option.xAxis]
    option.xAxis.push({
      type: 'value',
      gridIndex: 0,
      inverse: true,
      min: 0,
      max: getProfileAxisMax(profile, option.grid),
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisPointer: { show: false }
    })
    const profileXAxisIndex = option.xAxis.length - 1

    // 直方图置于蜡烛图之下（unshift 保证绘制顺序靠前）
    option.series.unshift({
      name: '成交量分布',
      type: 'custom',
      xAxisIndex: profileXAxisIndex,
      yAxisIndex: 0,
      clip: true,
      silent: true,
      data: profile.levels.map(level => ({ value: level })),
      renderItem: (params, api) => {
        const level = profile.levels[params.dataIndex]
        const up = Number(level.upVolume) || 0
        const down = Number(level.downVolume) || 0
        if (up <= 0 && down <= 0) return null

        // inverse 轴：x=0 在右边缘，条从右向左延伸
        const right = api.coord([0, Number(level.priceTo)])
        const left = api.coord([up + down, Number(level.priceFrom)])
        const x = right[0]
        const y = right[1]
        const height = Math.max(left[1] - y, 0)
        if (height <= 0) return null

        const children = []
        if (up > 0) {
          const upEnd = api.coord([up, Number(level.priceFrom)])
          const width = Math.max(x - upEnd[0], 0)
          if (width > 0) {
            children.push({
              type: 'rect',
              shape: { x: upEnd[0], y, width, height },
              style: { fill: 'rgba(255, 77, 79, 0.5)' }
            })
          }
        }
        if (down > 0) {
          const downStart = api.coord([up, Number(level.priceFrom)])
          const downEnd = api.coord([up + down, Number(level.priceFrom)])
          const width = Math.max(downStart[0] - downEnd[0], 0)
          if (width > 0) {
            children.push({
              type: 'rect',
              shape: { x: downEnd[0], y, width, height },
              style: { fill: 'rgba(58, 140, 62, 0.5)' }
            })
          }
        }
        return children.length ? { type: 'group', children } : null
      }
    })
  }

  if (trendPriceAnalysis) {
    const trendStyles = {
      RISING_TREND: { name: '上涨趋势', color: '#2563eb' },
      FALLING_TREND: { name: '下跌趋势', color: '#f97316' }
    }
    trendPriceAnalysis.trendLines.forEach((line, index) => {
      const style = trendStyles[line.lineType]
      if (
        !style ||
        !line.startDate ||
        !line.endDate ||
        !isValidPrice(line.startPrice) ||
        !isValidPrice(line.endPrice)
      ) {
        return
      }

      option.series.push({
        name: style.name,
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        silent: true,
        animation: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: style.color, width: 3 },
        itemStyle: { color: style.color },
        tooltip: { show: false },
        z: 12 + index,
        data: [
          { value: [line.startDate, Number(line.startPrice)] },
          {
            value: [line.endDate, Number(line.endPrice)],
            label: {
              show: true,
              position: 'right',
              align: 'left',
              offset: [LEVEL_LABEL_X_OFFSET, 0],
              color: style.color,
              fontWeight: 'bold',
              formatter: `${style.name} ${formatOverlayPrice(line.endPrice)}`
            }
          }
        ]
      })
    })

    const levelStartDate = trendPriceAnalysis.anchorStartDate || dates[0]
    const levelEndDate = trendPriceAnalysis.anchorEndDate || dates[dates.length - 1]
    const frequentLevelLabelLayouts = buildFrequentLevelLabelLayouts(trendPriceAnalysis)
    const emphasizedLevels = new Set(
      trendPriceAnalysis.frequentLevels
        .map((level, index) => ({ level, index }))
        .filter(({ level }) => isValidPrice(level.price))
        .sort((left, right) => Number(right.level.touchCount || 0) - Number(left.level.touchCount || 0))
        .slice(0, 2)
        .map(({ index }) => index)
    )
    trendPriceAnalysis.frequentLevels.forEach((level, index) => {
      if (!isValidPrice(level.price)) return
      const emphasized = emphasizedLevels.has(index)
      const support = level.levelType === 'SUPPORT'
      const color = support ? '#16a34a' : '#dc2626'
      const levelName = support ? '支撑' : '阻力'
      const label = `${levelName} ${formatOverlayPrice(level.price)} · ${Number(level.touchCount) || 0}次`
      const labelLayout = frequentLevelLabelLayouts.get(index) || {
        position: 'end',
        offset: [LEVEL_LABEL_X_OFFSET, 0]
      }
      option.series.push({
        name: label,
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        silent: true,
        animation: false,
        showSymbol: false,
        data: dates.map(() => null),
        tooltip: { show: false },
        z: 8 + index,
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color, type: 'dashed', width: emphasized ? 3 : 1.5 },
          label: {
            show: true,
            position: labelLayout.position,
            align: 'left',
            offset: labelLayout.offset,
            color,
            fontWeight: 'bold',
            formatter: label
          },
          data: [[{ coord: [levelStartDate, Number(level.price)] }, { coord: [levelEndDate, Number(level.price)] }]]
        }
      })
    })
  }

  // 👇 成交量（独立区域）
  if (hasVolume) {
    option.series.push({
      name: '成交量',
      type: 'bar',
      data: volumes,
      xAxisIndex: 1,
      yAxisIndex: 1,
      barWidth: '90%',
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

// 初始 dataZoom 区间：优先按 initialRange（默认近 3 个月）换算百分比，兜底 50~100
const getInitialZoom = () => {
  const len = props.data.length
  const range = props.initialRange
  if (len > 0 && range && range.startIndex >= 0 && range.endIndex > range.startIndex && range.endIndex < len) {
    return {
      start: Math.max(0, Math.min(100, (range.startIndex / len) * 100)),
      end: Math.max(0, Math.min(100, ((range.endIndex + 1) / len) * 100))
    }
  }
  return { start: 50, end: 100 }
}

// 当前 dataZoom 状态（百分比）：无实际缩放时使用初始区间，否则保持用户缩放位置
const getZoomState = () => {
  if (!chartInstance) return getInitialZoom()
  const opt = chartInstance.getOption()
  const dz = opt && opt.dataZoom
  const zoom = Array.isArray(dz) ? dz[0] : dz
  if (zoom && zoom.start !== undefined && zoom.end !== undefined) {
    return { start: Number(zoom.start), end: Number(zoom.end) }
  }
  return getInitialZoom()
}

// 当前可见数据区间索引
const getVisibleRange = () => {
  const len = props.data.length
  if (!chartInstance || len === 0) return null
  const { start, end } = getZoomState()
  const startIndex = Math.max(0, Math.floor((len * start) / 100))
  const endIndex = Math.min(len - 1, Math.max(startIndex, Math.ceil((len * end) / 100) - 1))
  return { startIndex, endIndex }
}

const emitRangeChange = () => {
  const range = getVisibleRange()
  if (range) emit('range-change', range)
}

// 初始化
const initChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  chartInstance.setOption(buildOption(), true)
  chartInstance.off('datazoom', emitRangeChange)
  chartInstance.on('datazoom', emitRangeChange)
  emitRangeChange()
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

// 监听成交量分布变化
watch(
  () => props.volumeProfile,
  () => {
    if (chartInstance) {
      chartInstance.setOption(buildOption(), true)
    }
  },
  { deep: true }
)

// 监听趋势线与频繁价位变化
watch(
  () => [props.trendPriceLevels, props.trendPriceOverlayEnabled],
  () => {
    if (chartInstance) {
      chartInstance.setOption(buildOption(), true)
    }
  },
  { deep: true }
)

// 监听 AVP 宽度比例变化（纯渲染参数，不重新请求数据）
watch(
  () => props.volumeProfileWidthPercent,
  () => {
    if (chartInstance) {
      chartInstance.setOption(buildOption(), true)
    }
  }
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
  height: 90vh;
}
</style>
