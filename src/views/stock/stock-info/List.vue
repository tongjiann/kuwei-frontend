<script setup lang="ts" name="StockInfo">
import { ArrowDown, ArrowUp, Edit, Plus, Search } from '@element-plus/icons-vue'
import type { StockInfo } from '#/stock/stock-info'
import Detail from '@/views/stock/stock-info/Detail.vue'
import Form from '@/views/stock/stock-info/Form.vue'
import { apiMultiTest, apiSyncDailyInfo, apiInitStockInfo, apiGetSimpleStockInfo } from '@/api/stock/stock-common'
import { apiGetKLineDataByStockId } from '@/api/stock/stock-daily-info'

import { checkPermission } from '@/utils/permission'
import dayjs from 'dayjs'

import { ref } from 'vue'
import CandlestickChart from '@/components/stock/CandlestickChart.vue'
import BackTestDialog from '@/components/stock/BackTestDialog.vue'

const klineData = ref([])
const backTestResultList = ref([])
const klineTitlePrefix = ref({})
const chartVisible = ref(false)
const backTestDialogVisible = ref(false)

const chartRef = ref()

const syncLoading = ref(false)

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
  try {
    const response = await apiGetKLineDataByStockId(stockId)
    klineData.value = response.data
    klineTitlePrefix.value = stockName ?? ''
    chartVisible.value = true
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const multiTest = async (dataStartTime?: string, code?: string) => {
  try {
    const { value } = await ElMessageBox.prompt('请选择回测起始日期', '提示', {
      inputType: 'date',
      inputValue: dataStartTime
    })

    const startDateStr = dayjs(value).format('YYYYMMDD')

    const res = await apiMultiTest({
      ...(code && { code }),
      startDateStr
    })

    backTestResultList.value = res.data
    backTestDialogVisible.value = true
  } catch (e) {
    // 用户取消 or 请求失败
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

  <el-dialog v-model="chartVisible" width="900px" destroy-on-close @opened="onDialogOpened">
    <CandlestickChart ref="chartRef" :data="klineData" :title-prefix="klineTitlePrefix" show-volume />
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

<style scoped lang="scss"></style>
