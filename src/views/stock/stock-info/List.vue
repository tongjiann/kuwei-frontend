<script setup lang="ts" name="StockInfo">
import { Plus, Edit, Search, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { StockInfo } from './type'
import type { StockDailyInfo, TrendPriceLevel, VolumeProfile } from '#/stock/stock-daily-info'
import Detail from '@/views/stock/stock-info/Detail.vue'
import Form from '@/views/stock/stock-info/Form.vue'
import { apiMultiTest, apiSyncDailyInfo, apiInitStockInfo, apiGetSimpleStockInfo } from '@/api/stock/stock-common'
import { apiGetKLineDataByStockId, apiGetTrendPriceLevels, apiGetVolumeProfile } from '@/api/stock/stock-daily-info'

import { checkPermission } from '@/utils/permission'
import dayjs from 'dayjs'
import { debounce } from 'lodash'

import { ref } from 'vue'
import CandlestickChart from '@/components/stock/CandlestickChart.vue'
import BackTestDialog from '@/components/stock/BackTestDialog.vue'

const klineData = ref<StockDailyInfo[]>([])
const backTestResultList = ref([])
const klineTitlePrefix = ref('')
const chartVisible = ref(false)
const volumeProfile = ref<VolumeProfile | null>(null)
const trendPriceLevels = ref<TrendPriceLevel | null>(null)
const trendPriceOverlayEnabled = ref(false)
const chartStockId = ref('')
const chartRowCount = ref(96)
const chartValueAreaPercent = ref(70)
const chartProfileWidthPercent = ref(15)
const volumeProfileEnabled = ref(true)
const chartRange = ref<{ startIndex: number; endIndex: number } | null>(null)
const chartInitialRange = ref<{ startIndex: number; endIndex: number } | null>(null)
let profileReqSeq = 0
let trendPriceReqSeq = 0
const backTestDialogVisible = ref(false)
const backTestDateDialogVisible = ref(false)

const chartRef = ref()

const syncLoading = ref(false)
const backTestSubmitting = ref(false)
const backTestStartDate = ref('')
const backTestStockCode = ref('')
const backTestDataStartTime = ref('')

const onDialogOpened = () => {
  // 👇 强制 resize（关键）
  chartRef.value?.resize?.()
}

const baseApi = '/stock/stock-info'

const { queryParam, loading, dataList, pagination, getList, onSearch, resetFilter, remove, batchRemove } =
  useList<StockInfo>({ baseApi, initQueryParam: {} })

const searchState = ref(false)

defineExpose({
  refresh: onSearch,
  addCondition: (key: keyof StockInfo, value: any, refresh = false) => {
    queryParam[key] = value
    if (refresh) onSearch()
  }
})

const sortChange = ({ column, prop, order }: { column: { sortBy?: string }; prop: string; order: string }) => {
  let orderBy: 'ASC' | 'DESC' | undefined
  switch (order) {
    case 'ascending':
      orderBy = 'ASC'
      break
    case 'descending':
      orderBy = 'DESC'
      break
    default:
      orderBy = undefined
  }
  pagination.orderBy = orderBy ? `${column.sortBy ?? prop}:${orderBy}` : undefined
  onSearch()
}

const formRef = ref()
const formTitle = ref('')
const submitting = ref(false)
const formVisible = ref(false)
const addSustainably = ref<boolean>(false)

const openForm = (id?: string) => {
  if (id) {
    addSustainably.value = false
    formTitle.value = '编辑'
  } else {
    addSustainably.value = true
    formTitle.value = '新建'
  }
  formVisible.value = true

  nextTick(() => formRef.value?.init(id))
}

const closeForm = () => {
  formVisible.value = false
}

const submit = (goOn = false) => {
  formRef.value?.submit().then((result: boolean) => {
    if (result) {
      if (!goOn) {
        formVisible.value = false
      }
      formRef.value?.reset()
    }
  })
}

const detailRef = ref()
const detailVisible = ref(false)
const dataId = ref('')

const openDetail = (id: string) => {
  dataId.value = id
  detailVisible.value = true

  nextTick(() => detailRef.value?.init(id))
}

const closeDetail = () => {
  detailVisible.value = false
}
const closeDetailAndOpenForm = () => {
  detailVisible.value = false
  openForm(dataId.value)
}

async function syncDailyInfo() {
  if (syncLoading.value) return

  syncLoading.value = true
  try {
    // 调你的接口
    await apiSyncDailyInfo()

    // 接口成功后刷新页面数据
    await getList()
  } catch (e) {
    console.error('同步失败', e)
  } finally {
    syncLoading.value = false
  }
}

const drawKLine = async (stockId: string, stockName?: string) => {
  chartStockId.value = stockId
  klineTitlePrefix.value = stockName ?? ''
  klineData.value = []
  volumeProfile.value = null
  volumeProfileEnabled.value = true
  trendPriceLevels.value = null
  trendPriceOverlayEnabled.value = false
  loadTrendPriceLevelsDebounced.cancel()
  trendPriceReqSeq += 1
  chartRange.value = null
  chartInitialRange.value = null
  await loadKLine()
}

const loadKLine = async () => {
  try {
    const response = await apiGetKLineDataByStockId(chartStockId.value)
    klineData.value = response.data || []
    chartVisible.value = true
    if (klineData.value.length) {
      chartRange.value = getDefaultRange()
      chartInitialRange.value = chartRange.value
      await loadVolumeProfile()
    }
  } catch (error) {
    console.error('获取K线数据失败:', error)
  }
}

// 默认展示近 3 个月：起点为第一条 date >= 3 个月前日期的 K 线，终点为最后一条
const getDefaultRange = () => {
  const len = klineData.value.length
  if (len === 0) return null
  const endIndex = len - 1
  const threshold = dayjs().subtract(3, 'month').format('YYYY-MM-DD')
  let startIndex = 0
  for (let i = 0; i < len; i++) {
    const d = normalizeDate(klineData.value[i]?.date)
    if (d && d >= threshold) {
      startIndex = i
      break
    }
  }
  return { startIndex, endIndex }
}

const handleRangeChange = ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
  const range = chartRange.value
  if (range && range.startIndex === startIndex && range.endIndex === endIndex) return
  chartRange.value = { startIndex, endIndex }
  loadVolumeProfileDebounced()
  if (trendPriceOverlayEnabled.value) loadTrendPriceLevelsDebounced()
}

const loadVolumeProfile = async () => {
  if (!volumeProfileEnabled.value) {
    volumeProfile.value = null
    return
  }
  const range = chartRange.value
  const len = klineData.value.length
  if (!range || len === 0 || range.startIndex >= range.endIndex) {
    volumeProfile.value = null
    return
  }
  const startDate = normalizeDate(klineData.value[range.startIndex]?.date)
  const endDate = normalizeDate(klineData.value[range.endIndex]?.date)
  if (!startDate || !endDate) {
    volumeProfile.value = null
    return
  }
  const seq = ++profileReqSeq
  try {
    const response = await apiGetVolumeProfile({
      stockId: chartStockId.value,
      startDate,
      endDate,
      rowCount: chartRowCount.value,
      valueAreaPercent: chartValueAreaPercent.value
    })
    if (seq !== profileReqSeq) return
    volumeProfile.value = response.data || null
  } catch (error) {
    console.error('获取成交量分布失败:', error)
    if (seq === profileReqSeq) volumeProfile.value = null
  }
}

const loadVolumeProfileDebounced = debounce(loadVolumeProfile, 500)

const loadTrendPriceLevels = async () => {
  if (!trendPriceOverlayEnabled.value) {
    trendPriceLevels.value = null
    return
  }

  const range = chartRange.value
  const len = klineData.value.length
  if (!range || len === 0 || range.startIndex > range.endIndex) {
    trendPriceLevels.value = null
    return
  }

  const startDate = normalizeDate(klineData.value[range.startIndex]?.date)
  const endDate = normalizeDate(klineData.value[range.endIndex]?.date)
  if (!startDate || !endDate) {
    trendPriceLevels.value = null
    return
  }

  const seq = ++trendPriceReqSeq
  try {
    const response = await apiGetTrendPriceLevels({
      stockId: chartStockId.value,
      startDate,
      endDate,
      rowCount: chartRowCount.value
    })
    if (seq !== trendPriceReqSeq || !trendPriceOverlayEnabled.value) return
    trendPriceLevels.value = response.data || null
  } catch (error) {
    console.error('获取趋势线与频繁价位失败:', error)
    if (seq === trendPriceReqSeq) trendPriceLevels.value = null
  }
}

const loadTrendPriceLevelsDebounced = debounce(loadTrendPriceLevels, 500)

const onTrendPriceOverlayChange = (enabled: boolean) => {
  loadTrendPriceLevelsDebounced.cancel()
  trendPriceReqSeq += 1
  if (enabled) {
    loadTrendPriceLevels()
    return
  }
  trendPriceLevels.value = null
}

const onVolumeProfileEnabledChange = (enabled: boolean) => {
  loadVolumeProfileDebounced.cancel()
  profileReqSeq += 1
  if (enabled) {
    loadVolumeProfile()
    return
  }
  volumeProfile.value = null
}

const onChartOptionChange = () => {
  loadVolumeProfileDebounced.cancel()
  loadVolumeProfile()
  loadTrendPriceLevelsDebounced.cancel()
  if (trendPriceOverlayEnabled.value) loadTrendPriceLevels()
}

const formatPrice = (value?: number | null) => (value == null ? '--' : Number(value).toFixed(2))

const formatVolume = (value?: number | null) => (value == null ? '--' : Number(value).toLocaleString())

const normalizeDate = (date?: string) => {
  if (!date) return ''

  if (/^\d{8}$/.test(date)) {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
  }

  const parsedDate = dayjs(date)
  return parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : ''
}

const backTestDateOptions = computed(() => [
  {
    label: '数据起始日',
    value: backTestDataStartTime.value,
    disabled: !backTestDataStartTime.value
  },
  {
    label: '近1年',
    value: dayjs().subtract(1, 'year').format('YYYY-MM-DD')
  },
  {
    label: '近半年',
    value: dayjs().subtract(6, 'month').format('YYYY-MM-DD')
  },
  {
    label: '近3月',
    value: dayjs().subtract(3, 'month').format('YYYY-MM-DD')
  },
  {
    label: '近1月',
    value: dayjs().subtract(1, 'month').format('YYYY-MM-DD')
  }
])

const multiTest = (dataStartTime?: string, code?: string) => {
  backTestStockCode.value = code ?? ''
  backTestDataStartTime.value = normalizeDate(dataStartTime)
  backTestStartDate.value = backTestDataStartTime.value || dayjs().subtract(1, 'year').format('YYYY-MM-DD')
  backTestDateDialogVisible.value = true
}

const selectBackTestDate = (date: string) => {
  if (!date) return
  backTestStartDate.value = date
}

const submitMultiTest = async () => {
  if (!backTestStartDate.value) {
    ElMessage.warning('请选择回测开始日期')
    return
  }

  backTestSubmitting.value = true
  try {
    const res = await apiMultiTest({
      ...(backTestStockCode.value && { code: backTestStockCode.value }),
      startDateStr: dayjs(backTestStartDate.value).format('YYYYMMDD')
    })

    backTestResultList.value = res.data
    backTestDateDialogVisible.value = false
    backTestDialogVisible.value = true
  } finally {
    backTestSubmitting.value = false
  }
}

const handleOperation = (code: string, value?: string | string[], row?: StockInfo) => {
  switch (code) {
    case 'detail':
      openDetail(value as string)
      break
    case 'create':
    case 'update':
      openForm(value as string)
      break
    case 'remove':
      remove(value as string, row?.name)
      break
    case 'batchRemove':
      batchRemove(value as string[])
      break
    default:
      throw new Error(`不存在的操作编码${code}!`)
  }
}

const refreshData = (haveNewData?: boolean) => {
  haveNewData ? onSearch() : getList()
}

const router = useRouter()

const activated = () => {
  nextTick(() => {
    const query = router.currentRoute.value.query
    for (const queryKey in query) {
      queryParam[queryKey as keyof StockInfo] = query[queryKey] as any
    }

    onSearch()
  })
}

function handleOpen() {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

router.currentRoute.value.meta.keepAlive ? onActivated(activated) : activated()

const addStockVisible = ref(false)

const addStockForm = ref({
  code: '',
  name: ''
})

const addStockLoading = ref(false)

/* ================= 🔍 搜索相关 ================= */

const searchOptions = ref<
  Array<{
    code: string
    name: string
    type: number
    typeStr: string
  }>
>([])

const searchLoading = ref(false)
const selectedStock = ref<any>(null)

let searchTimer: any = null
let lastKeyword = '' // 当前输入值
let lastSearched = '' // 上一次真正请求的值
let requestId = 0

const handleSearch = (keyword: string) => {
  // ✅ 1. 输入为空 → 不请求（且清空）
  if (!keyword) {
    lastKeyword = ''
    lastSearched = ''
    searchOptions.value = []
    return
  }

  // ✅ 2. 输入未变化 → 不处理
  if (keyword === lastKeyword) {
    return
  }

  lastKeyword = keyword

  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(async () => {
    // ✅ 3. 防抖结束后再次判断（防止输入被改掉）
    if (!lastKeyword || lastKeyword === lastSearched) {
      return
    }

    const currentId = ++requestId
    lastSearched = lastKeyword

    // ✅ 仅在真正请求时清空
    searchOptions.value = []
    searchLoading.value = true

    try {
      const res = await apiGetSimpleStockInfo({ key: lastKeyword })

      if (currentId === requestId) {
        searchOptions.value = res.data || []
      }
    } catch (e) {
      console.error('搜索失败', e)
    } finally {
      if (currentId === requestId) {
        searchLoading.value = false
      }
    }
  }, 500)
}

const handleSelect = (item: any) => {
  if (!item) return
  addStockForm.value.code = item.code
  addStockForm.value.name = item.name
}

/* ================= 弹窗 ================= */

const openAddStockDialog = () => {
  addStockForm.value = { code: '', name: '' }

  // ✅ 清理搜索状态
  selectedStock.value = null
  searchOptions.value = []

  addStockVisible.value = true
}

const submitAddStock = async () => {
  if (!addStockForm.value.code || !addStockForm.value.name) {
    ElMessage.warning('请输入编码和名称')
    return
  }

  addStockLoading.value = true
  try {
    await apiInitStockInfo(addStockForm.value)
    ElMessage.success('新增成功')
    addStockVisible.value = false
  } finally {
    addStockLoading.value = false
  }
}
</script>

<template>
  <div class="list-page">
    <el-space wrap class="list-operation">
      <el-button v-has-permission="'create'" type="primary" :icon="Plus" @click="handleOperation('create')">
        新建
      </el-button>
      <el-button type="primary" :loading="syncLoading" @click="syncDailyInfo"> 同步每日信息</el-button>
      <el-button type="success" @click="openAddStockDialog"> 增加股票</el-button>
      <el-space>
        <span class="search">
          <el-input v-model="queryParam.code" placeholder="编码" clearable @change="onSearch" />
        </span>
        <el-button :icon="Search" type="primary" @click="onSearch">查询</el-button>
        <el-button title="重置查询条件" @click="resetFilter">重置</el-button>
        <el-button
          :icon="searchState ? ArrowUp : ArrowDown"
          :title="searchState ? '收起' : '展开'"
          @click="searchState = !searchState"
        />
      </el-space>
    </el-space>

    <el-form v-show="searchState" label-width="80px" class="list-search" @submit.prevent>
      <el-row :gutter="18">
        <el-col :md="24" :sm="24">
          <el-form-item prop="name" label="名称">
            <el-input v-model="queryParam.name" clearable @change="onSearch" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table
      ref="tableRef"
      v-loading="loading"
      class="list-body"
      :data="dataList"
      height="100%"
      stripe
      row-key="id"
      style="border-top: 1px solid var(--el-border-color-lighter)"
      @row-dblclick="(row: StockInfo) => checkPermission('detail') && handleOperation('detail', row.id)"
      @sort-change="sortChange"
    >
      <el-table-column type="index" width="50" fixed label="#" />
      <el-table-column width="100" label="名称" prop="name" show-overflow-tooltip />
      <el-table-column width="100" label="编码" prop="code" show-overflow-tooltip />
      <el-table-column width="100" label="来源" prop="source" show-overflow-tooltip />
      <el-table-column width="150" label="数据起始时间" prop="dataStartTime" show-overflow-tooltip />
      <el-table-column width="150" label="最新数据更新时间" prop="latestDataFreshTime" show-overflow-tooltip />
      <el-table-column width="120" label="是否关注" prop="isFollowed" sortable="custom" show-overflow-tooltip>
        <template #default="{ row }: { row: StockInfo }">
          {{ row.isFollowed ? '是' : '否' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }: { row: StockInfo }">
          <el-space>
            <el-button
              v-has-permission="'detail'"
              type="primary"
              text
              bg
              size="small"
              @click="handleOperation('detail', row.id)"
            >
              详情
            </el-button>

            <el-button @click="multiTest(row.dataStartTime, row.code)">多策略回测</el-button>

            <el-button @click="drawKLine(row.id, row.name)">K线</el-button>
            <el-dropdown
              v-has-permission="['update', 'delete']"
              @command="(code: string) => handleOperation(code, row.id, row)"
            >
              <el-button text bg type="primary" size="small">
                {{ $t('operation.more') }}
                <el-icon :size="16" style="margin-left: 5px">
                  <ArrowDown />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="checkPermission('update')" command="update">
                    <el-button link>编辑</el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="checkPermission('delete')" command="remove">
                    <el-button link type="danger">删除</el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="pagination.total"
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.pageSize"
      size="small"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      @size-change="getList()"
      @current-change="getList()"
    />

    <el-dialog v-model="formVisible" width="60%" :title="formTitle" draggable @close="closeForm">
      <Form
        ref="formRef"
        @submitting="(val: boolean) => (submitting = val)"
        @complete="(id?: string, isNew?: boolean) => refreshData(isNew)"
      />

      <template #footer>
        <el-button @click="closeForm">取消</el-button>
        <el-button v-show="addSustainably" type="primary" :loading="submitting" @click="submit(true)">
          保存并继续
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submit()">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" width="60%" title="详情" draggable @close="closeDetail">
      <Detail ref="detailRef" />

      <template #footer>
        <el-button
          v-has-permission="'update'"
          plain
          :icon="Edit"
          type="primary"
          style="position: absolute; left: var(--el-dialog-padding-primary)"
          @click="closeDetailAndOpenForm"
        >
          编辑
        </el-button>
        <el-button @click="closeDetail">关闭</el-button>
      </template>
    </el-dialog>
  </div>

  <el-dialog v-model="chartVisible" width="95%" align-center destroy-on-close @opened="onDialogOpened">
    <div v-if="klineData.length" class="kline-chart-toolbar">
      <el-descriptions v-if="volumeProfile" :column="5" size="small" border class="kline-chart-summary">
        <el-descriptions-item label="锚定区间">
          {{ volumeProfile?.anchorStartDate }} ~ {{ volumeProfile?.anchorEndDate }}
        </el-descriptions-item>
        <el-descriptions-item label="POC">{{ formatPrice(volumeProfile?.pocPrice) }}</el-descriptions-item>
        <el-descriptions-item label="VAH">{{ formatPrice(volumeProfile?.valueAreaHigh) }}</el-descriptions-item>
        <el-descriptions-item label="VAL">{{ formatPrice(volumeProfile?.valueAreaLow) }}</el-descriptions-item>
        <el-descriptions-item label="总成交量">{{ formatVolume(volumeProfile?.totalVolume) }}</el-descriptions-item>
      </el-descriptions>
      <el-space class="kline-chart-controls" :size="8">
        <span>价格档数</span>
        <el-select v-model="chartRowCount" size="small" style="width: 100px" @change="onChartOptionChange">
          <el-option v-for="n in [24, 48, 96]" :key="n" :label="`${n}档`" :value="n" />
        </el-select>
        <span>价值区域</span>
        <el-select v-model="chartValueAreaPercent" size="small" style="width: 100px" @change="onChartOptionChange">
          <el-option v-for="n in [60, 70, 80]" :key="n" :label="`${n}%`" :value="n" />
        </el-select>
        <span>AVP</span>
        <el-switch v-model="volumeProfileEnabled" @change="onVolumeProfileEnabledChange" />
        <span>AVP宽度</span>
        <el-select
          v-model="chartProfileWidthPercent"
          size="small"
          style="width: 100px"
          :disabled="!volumeProfileEnabled"
        >
          <el-option v-for="n in [5, 10, 15, 20]" :key="n" :label="`${n}%`" :value="n" />
        </el-select>
        <span>趋势线/价位</span>
        <el-switch v-model="trendPriceOverlayEnabled" @change="onTrendPriceOverlayChange" />
      </el-space>
    </div>
    <CandlestickChart
      ref="chartRef"
      :data="klineData"
      :volume-profile="volumeProfile"
      :trend-price-levels="trendPriceLevels"
      :trend-price-overlay-enabled="trendPriceOverlayEnabled"
      :volume-profile-width-percent="chartProfileWidthPercent"
      :initial-range="chartInitialRange"
      :title-prefix="klineTitlePrefix"
      show-volume
      @range-change="handleRangeChange"
    />
  </el-dialog>

  <el-dialog v-model="backTestDateDialogVisible" title="选择回测时间" width="460px" draggable>
    <el-form label-width="90px">
      <el-form-item label="开始日期" required>
        <el-date-picker
          v-model="backTestStartDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择回测开始日期"
          style="width: 220px"
        />
      </el-form-item>

      <el-form-item label="周期">
        <el-space wrap>
          <el-button
            v-for="item in backTestDateOptions"
            :key="item.label"
            size="small"
            :type="backTestStartDate === item.value ? 'primary' : undefined"
            :disabled="item.disabled"
            @click="selectBackTestDate(item.value)"
          >
            {{ item.label }}
          </el-button>
        </el-space>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="backTestDateDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="backTestSubmitting" @click="submitMultiTest">确认</el-button>
    </template>
  </el-dialog>

  <BackTestDialog v-model="backTestDialogVisible" :data="backTestResultList" @open="handleOpen" />

  <el-dialog v-model="addStockVisible" title="新增股票" width="400px">
    <el-form label-width="80px">
      <!-- 🔍 远程搜索 -->
      <el-form-item label="搜索">
        <el-select
          v-model="selectedStock"
          filterable
          remote
          reserve-keyword
          placeholder="输入名称/编码搜索"
          :remote-method="handleSearch"
          :loading="searchLoading"
          style="width: 100%"
          @change="handleSelect"
        >
          <el-option
            v-for="item in searchOptions"
            :key="item.code"
            :label="'【' + item.typeStr + '】' + item.name + ' - ' + item.code"
            :value="item"
          />
        </el-select>
      </el-form-item>

      <!-- 自动填充 -->
      <el-form-item label="编码">
        <el-input v-model="addStockForm.code" />
      </el-form-item>

      <el-form-item label="名称">
        <el-input v-model="addStockForm.name" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="addStockVisible = false">取消</el-button>
      <el-button type="primary" :loading="addStockLoading" @click="submitAddStock"> 确认</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.kline-chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;

  .kline-chart-summary {
    flex: 1;
    min-width: 480px;
  }

  .kline-chart-controls {
    flex-shrink: 0;
  }
}
</style>
