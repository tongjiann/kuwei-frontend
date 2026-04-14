<script setup lang="ts" name="StockInfo">
import { ArrowDown, ArrowUp, Edit, Plus, Search } from '@element-plus/icons-vue'
import type { StockInfo } from '#/stock/stock-info'
import Detail from '@/views/stock/stock-info/Detail.vue'
import Form from '@/views/stock/stock-info/Form.vue'
import { apiMultiTest, apiSyncDailyInfo } from '@/api/stock/stock-common'
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
</script>

<template>
  <div class="list-page">
    <el-space wrap class="list-operation">
      <el-button v-has-permission="'create'" type="primary" :icon="Plus" @click="handleOperation('create')">
        新建
      </el-button>
      <el-button type="primary" :loading="syncLoading" @click="syncDailyInfo"> 同步每日信息</el-button>
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
</template>

<style scoped lang="scss"></style>
