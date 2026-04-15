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

  <v-chart ref="chartRef" :option="option" style="height: 520px" autoresize @finished="initChartClick" />

  <!-- 信号详情弹窗 -->
  <el-dialog v-model="dialogVisible" title="信号详情" width="800px">
    <div v-if="currentDetail">
      <h4>信号列表</h4>
      <el-table :data="currentDetail.signals" border>
        <el-table-column prop="code" label="股票" />
        <el-table-column label="方向">
          <template #default="{ row }">
            {{ row.sign === 0 ? '买' : '卖' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" />
        <el-table-column prop="strength" label="强度" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h4 style="margin-top: 20px">交易记录</h4>
      <el-table :data="currentDetail.trades" border>
        <el-table-column prop="code" label="股票" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="price" label="价格" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="amount" label="金额" />
        <el-table-column prop="pnl" label="盈亏" />
        <el-table-column prop="description" label="说明" />
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps({
  data: Object
})

const chartRef = ref(null)

// ====== 弹窗相关 ======
const dialogVisible = ref(false)
const currentDetail = ref(null)

// 用于点击查找
let signalMap = {}

// ====== 图表点击事件 ======
function initChartClick() {
  const chart = chartRef.value?.chart
  if (!chart) return

  chart.off('click')

  chart.on('click', params => {
    if (params.componentType === 'markPoint') {
      const key = params.data.key
      currentDetail.value = signalMap[key]
      dialogVisible.value = true
    }
  })
}

// ====== 监听数据变化 ======
watch(
  () => props.data,
  () => {
    nextTick(() => {
      chartRef.value?.resize()
      initChartClick()
    })
  },
  { deep: true }
)

// ====== 核心 option ======
const option = computed(() => {
  const r = props.data
  if (!r?.portfolioDailyRecordList) return {}

  const dates = []
  const total = []
  const cash = []
  const pos = []

  const stockMap = {}
  const baseMap = {}

  const signalPoints = []
  signalMap = {}

  r.portfolioDailyRecordList.forEach((d, i) => {
    dates.push(d.date)
    total.push(d.totalAsset)
    cash.push(d.cash)
    pos.push(d.totalPositionValue)

    // ===== 股票数据 =====
    Object.values(d.positionMap || {}).forEach(p => {
      if (!stockMap[p.code]) stockMap[p.code] = []
      if (baseMap[p.code] == null) baseMap[p.code] = p.price
      stockMap[p.code][i] = p.price
    })

    // ===== 信号处理（已修改）=====
    const signals = d.signalList || []
    if (signals.length > 0) {
      const key = `${d.date}_${i}`

      const trades = d.tradeList || []
      const hasTrade = trades.length > 0

      // 合并当天信号
      signalMap[key] = {
        date: d.date,
        signals: signals,
        trades: trades
      }

      // 判断买卖
      const hasBuy = signals.some(s => s.sign === 0)
      const label = hasBuy ? 'B' : 'S'

      signalPoints.push({
        name: label,
        coord: [d.date, d.totalAsset],
        value: label,

        symbol: 'circle',
        symbolSize: 14,
        itemStyle: {
          color: hasTrade ? (hasBuy ? '#67C23A' : '#F56C6C') : '#ffffff',

          borderColor: hasBuy ? '#67C23A' : '#F56C6C',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: label,
          color: hasTrade ? '#fff' : hasBuy ? '#67C23A' : '#F56C6C',
          fontSize: 10,
          fontWeight: 'bold'
        },
        key
      })
    }
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
      {
        name: '总资产',
        type: 'line',
        data: total,
        markPoint: {
          symbol: 'circle',
          data: signalPoints
        }
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
