<template>
  <!-- 指标卡片 -->
  <el-row :gutter="16" class="mb-4" justify="center">
    <el-col :span="4">
      <Card title="收益率" :value="formatPercent(data.returnRate)" />
    </el-col>
    <el-col :span="4">
      <Card title="最大回撤" :value="formatPercent(data.maxDrawDown)" />
    </el-col>
    <el-col :span="4">
      <Card title="夏普率" :value="formatNumber(data.sharpeRatio)" />
    </el-col>
    <el-col :span="4">
      <Card title="总信号数" :value="data.signalSize" />
    </el-col>
    <el-col :span="4">
      <Card title="总交易数" :value="data.tradeDetailSize" />
    </el-col>
  </el-row>

  <!-- 过滤栏：模式 + 聚合窗口 -->
  <div class="filter-bar">
    <template v-if="signalFilterMode === 'all'">
      <el-divider direction="vertical" />
      <span class="filter-label">动态聚合窗口：</span>
      <el-radio-group v-model="aggWindow" size="small">
        <el-radio-button :value="1">动态聚合</el-radio-button>
        <el-radio-button :value="3">3天</el-radio-button>
        <el-radio-button :value="5">5天</el-radio-button>
      </el-radio-group>
      <span class="tip-text" style="margin-left: 8px">
        （从第一个信号日开始，聚合后续
        {{
          aggWindow === 1 ? Math.floor(currentTotalSize / baseRatio) + '(共' + currentTotalSize + '天)' : aggWindow
        }}天内的信号）
      </span>
    </template>
  </div>

  <v-chart ref="chartRef" :option="option" style="height: 520px" autoresize @finished="initChartClick" />

  <!-- 信号详情弹窗（支持聚合后的多日数据） -->
  <el-dialog v-model="dialogVisible" title="信号详情" width="900px">
    <div v-if="currentDetail">
      <h3>
        {{
          currentDetail.dateRange
            ? `日期区间：${currentDetail.dateRange.start} ~ ${currentDetail.dateRange.end}`
            : `日期：${currentDetail.date}`
        }}
      </h3>
      <p v-if="currentDetail.aggCount">
        共聚合 {{ currentDetail.aggCount }} 个信号日，总计 {{ currentDetail.totalSignals }} 条信号，{{
          currentDetail.totalTrades
        }}
        条交易。
      </p>

      <h4>信号列表（合并）</h4>
      <el-table :data="currentDetail.signals" border max-height="300">
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="code" label="股票" />
        <el-table-column label="方向">
          <template #default="{ row }">{{ row.sign === 0 ? '买' : '卖' }}</template>
        </el-table-column>
        <el-table-column prop="price" label="价格" />
        <el-table-column prop="strength" label="强度">
          <template #default="{ row }">{{ formatPercent(row.strength) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
      </el-table>

      <h4 style="margin-top: 20px">交易记录（合并）</h4>
      <el-table :data="currentDetail.trades" border max-height="300">
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="code" label="股票" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">{{ formatNumber(row.price) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">{{ formatNumber(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="pnl" label="盈亏">
          <template #default="{ row }">{{ formatNumber(row.pnl) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, nextTick, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps({
  data: Object
})

const chartRef = ref(null)
const dialogVisible = ref(false)
const currentDetail = ref(null)
let globalSignalMap = {} // 存储所有信号详情（原始 + 聚合）

// UI 状态
const signalFilterMode = ref('all')
const aggWindow = ref(1) // 动态聚合窗口（天数）

const currentTotalSize = ref(0)

const baseRatio = 15

// 点击事件
function initChartClick() {
  const chart = chartRef.value?.chart
  if (!chart) return
  chart.off('click')
  chart.on('click', params => {
    if (params.componentType === 'markPoint') {
      const key = params.data.key
      currentDetail.value = globalSignalMap[key]
      dialogVisible.value = true
    }
  })
}

// 监听 dataZoom 事件,更新当前可见数据数量
function initDataZoomListener() {
  const chart = chartRef.value?.chart
  if (!chart) return

  // 移除旧的监听器
  chart.off('dataZoom')

  // 添加 dataZoom 监听
  chart.on('dataZoom', params => {
    updateCurrentVisibleSize()
  })

  // 初始化时也计算一次
  updateCurrentVisibleSize()
}

// 计算当前可见的数据数量
function updateCurrentVisibleSize() {
  const chart = chartRef.value?.chart
  if (!chart) return

  const option = chart.getOption()
  const dataZoom = option.dataZoom?.[0] // 获取第一个 dataZoom 配置

  if (dataZoom && props.data?.portfolioDailyRecordList) {
    const totalDataLength = props.data.portfolioDailyRecordList.length
    const startPercent = dataZoom.start || 0
    const endPercent = dataZoom.end || 100

    // 计算可见数据数量
    const visibleSize = Math.round((totalDataLength * (endPercent - startPercent)) / 100)
    currentTotalSize.value = Math.max(1, visibleSize) // 至少为1
  } else {
    // 没有缩放时,显示全部数据
    currentTotalSize.value = props.data?.portfolioDailyRecordList?.length || 0
  }
}

watch(
  () => [props.data, signalFilterMode.value, aggWindow.value],
  () => {
    nextTick(() => {
      chartRef.value?.resize()
      initChartClick()
      initDataZoomListener()
    })
  },
  { deep: true }
)

// 组件挂载后初始化监听
onMounted(() => {
  nextTick(() => {
    initChartClick()
    initDataZoomListener()
  })
})

// ========== 新的动态聚合函数（从第一个信号日开始，向后聚合窗口内的信号）==========
/**
 * 从第一天开始遍历，找到有信号的第一天，然后将这一天以及之后的windowDays内的数据进行聚合
 * @param {Array} rawPoints 原始点数组，每个点包含 { date, totalAsset, key, hasBuy, hasTrade, label, signals, trades }
 * @param {number} windowDays 窗口天数（从信号日开始向后聚合）
 * @param {Object} signalMap 信号详情映射表（key -> { signals, trades }）
 * @returns {Array} 聚合后的点数组，同时会向 signalMap 中添加聚合点的详情
 */
function dynamicAggregate(rawPoints, windowDays, signalMap) {
  if (windowDays <= 1 || !rawPoints.length) return rawPoints

  // 按日期排序
  const sorted = [...rawPoints].sort((a, b) => new Date(a.date) - new Date(b.date))
  const aggregated = []
  let i = 0

  while (i < sorted.length) {
    // 找到当前信号日（起始点）
    const startPoint = sorted[i]
    const startDate = new Date(startPoint.date)
    const group = [startPoint]

    // 计算窗口结束日期（startDate + windowDays天）
    const windowEndDate = new Date(startDate)
    windowEndDate.setDate(windowEndDate.getDate() + windowDays)

    // 向后查找窗口内的所有信号点
    let j = i + 1
    while (j < sorted.length) {
      const currentPoint = sorted[j]
      const currentDate = new Date(currentPoint.date)

      // 如果在窗口内，加入当前组
      if (currentDate < windowEndDate) {
        group.push(currentPoint)
        j++
      } else {
        break
      }
    }

    // 处理当前组，生成聚合标记点
    const first = group[0]
    const last = group[group.length - 1]

    let buyCount = 0,
      sellCount = 0
    const allSignals = []
    const allTrades = []

    group.forEach(p => {
      const detail = signalMap[p.key]
      if (detail) {
        if (detail.signals) {
          detail.signals.forEach(s => {
            allSignals.push({ ...s, date: p.date })
            if (s.sign === 0) buyCount++
            else sellCount++
          })
        }
        if (detail.trades) {
          detail.trades.forEach(t => {
            allTrades.push({ ...t, date: p.date })
          })
        }
      } else {
        // 降级：使用点自带的 signals/trades
        if (p.signals) {
          p.signals.forEach(s => {
            allSignals.push({ ...s, date: p.date })
            if (s.sign === 0) buyCount++
            else sellCount++
          })
        }
        if (p.trades) {
          p.trades.forEach(t => allTrades.push({ ...t, date: p.date }))
        }
      }
    })

    // 生成标签
    let label = ''
    if (buyCount > 0 && sellCount === 0) label = `B${buyCount}`
    else if (sellCount > 0 && buyCount === 0) label = `S${sellCount}`
    else if (buyCount > 0 && sellCount > 0) label = `B${buyCount}\nS${sellCount}`
    else label = '?'

    const hasTrade = allTrades.length > 0
    // 0:买卖都有｜1:卖｜2:买
    const type = buyCount > 0 && sellCount > 0 ? 0 : buyCount > 0 && sellCount === 0 ? 1 : 2
    const color = type === 2 ? '#67C23A' : type === 1 ? '#F56C6C' : '#ae9753'
    const aggKey = `dynamic_${first.date}_${last.date}`

    // 存储聚合详情到 signalMap（供弹窗使用）
    signalMap[aggKey] = {
      dateRange: { start: first.date, end: last.date },
      date: `${first.date} 至 ${last.date}`,
      aggCount: group.length,
      totalSignals: allSignals.length,
      totalTrades: allTrades.length,
      signals: allSignals,
      trades: allTrades
    }

    aggregated.push({
      name: label,
      coord: [first.date, first.totalAsset],
      value: label,
      symbol: 'circle',
      symbolSize: 25,
      itemStyle: {
        color: hasTrade ? color : '#ffffff',
        borderColor: color,
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: label,
        color: hasTrade ? '#fff' : color,
        fontSize: 10,
        fontWeight: 'bold'
      },
      key: aggKey
    })

    // 跳到下一个未处理的信号点
    i = j
  }

  return aggregated
}

// ========== 核心图表配置 ==========
const option = computed(() => {
  const r = props.data
  if (!r?.portfolioDailyRecordList) return {}

  const dates = []
  const total = []
  const cash = []
  const pos = []
  const stockMap = {}
  const rawSignalPoints = []
  globalSignalMap = {} // 重置

  r.portfolioDailyRecordList.forEach((d, i) => {
    dates.push(d.date)
    total.push(d.totalAsset)
    cash.push(d.cash)
    pos.push(d.totalPositionValue)

    // 股票数据
    Object.values(d.positionMap || {}).forEach(p => {
      if (!stockMap[p.code]) stockMap[p.code] = []
      stockMap[p.code][i] = p.price
    })

    // 信号处理
    const signals = d.signalList || []
    if (signals.length > 0) {
      const key = `${d.date}_${i}`
      const trades = d.tradeList || []
      const hasTrade = trades.length > 0
      const hasBuy = signals.some(s => s.sign === 0)
      const label = hasBuy ? 'B' : 'S'

      globalSignalMap[key] = { date: d.date, signals, trades }

      const shouldShowRaw = signalFilterMode.value === 'all' || hasTrade
      if (shouldShowRaw) {
        rawSignalPoints.push({
          date: d.date,
          totalAsset: d.totalAsset,
          hasBuy,
          hasTrade,
          label,
          key,
          signals,
          trades
        })
      }
    }
  })

  let windowDays = aggWindow.value
  if (windowDays === 1) {
    // 动态聚合：根据当前可见数据量计算窗口大小
    windowDays = Math.max(2, Math.round(currentTotalSize.value / baseRatio))
  }
  // 使用新的动态聚合算法
  const finalPoints = dynamicAggregate(rawSignalPoints, windowDays, globalSignalMap)

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
      {
        name: '总资产',
        type: 'line',
        data: total,
        markPoint: { symbol: 'circle', data: finalPoints }
      },
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
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
}

.tip-text {
  font-size: 12px;
  color: #909399;
}

.tip-text.warning {
  color: #e6a23c;
}
</style>
