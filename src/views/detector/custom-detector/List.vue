<script setup lang="ts" name="CustomDetector">
import { Plus, Edit, Search, ArrowDown } from '@element-plus/icons-vue'
import type { CustomDetector } from './type'
import ExcelExport from '@/components/excel/Export.vue'
import Detail from '@/views/detector/custom-detector/Detail.vue'
import Form from '@/views/detector/custom-detector/Form.vue'
import { apiSingleDetectorMultiCodeTest } from '@/api/stock/stock-common'

import { checkPermission } from '@/utils/permission'
import dayjs from 'dayjs'
import BackTestDialog from '@/components/stock/BackTestDialog.vue'
import { ref } from 'vue'
import { ElMessage, type ElTable } from 'element-plus'
import { api } from '@/utils/request'

interface SimpleStockInfo {
  code: string
  name: string
  typeStr?: string
}

const baseApi = '/detector/custom-detector'

const {
  queryParam,
  loading,
  dataList,
  pagination,
  getList,
  onSearch,
  resetFilter,
  buildQueryParam,
  remove,
  batchRemove
} = useList<CustomDetector>({ baseApi, initQueryParam: {} })

defineExpose({
  refresh: onSearch,
  addCondition: (key: keyof CustomDetector, value: any, refresh = false) => {
    queryParam[key] = value
    if (refresh) onSearch()
  }
})

const { initRelatedData, relatedData } = useOption({
  load: {
    templateIdOptions: { type: 'DetectorTemplate', label: 'name' }
  }
})
initRelatedData()

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

const selectedKeys = ref<Array<string>>([])
const tableRef = ref<InstanceType<typeof ElTable>>()

watch(
  dataList,
  () => {
    selectedKeys.value = []
    tableRef.value?.clearSelection()
  },
  { deep: true }
)

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

const backTestResultList = ref([])
const backTestDialogVisible = ref(false)
const multiCodeTestVisible = ref(false)
const multiCodeTestDetectorId = ref('')
const multiCodeTestStartDate = ref('')
const multiCodeTestStockList = ref<SimpleStockInfo[]>([])
const multiCodeTestSelectedStockList = ref<SimpleStockInfo[]>([])
const multiCodeTestLoading = ref(false)
const multiCodeTestSubmitting = ref(false)
const multiCodeTestStockTableRef = ref<InstanceType<typeof ElTable>>()
let multiCodeTestRequestId = 0

const loadMultiCodeTestStockList = async () => {
  const currentId = ++multiCodeTestRequestId
  multiCodeTestLoading.value = true

  try {
    const res = await api.get('stock/stock-info?pageIndex=1&pageSize=999999&orderBy=isFollowed%3ADESC', {})

    if (currentId === multiCodeTestRequestId) {
      multiCodeTestStockList.value = res.data || []
    }
  } catch (e) {
    if (currentId === multiCodeTestRequestId) {
      multiCodeTestStockList.value = []
    }
  } finally {
    if (currentId === multiCodeTestRequestId) {
      multiCodeTestLoading.value = false
    }
  }
}

const singleDetectorMultiCodeTest = async (detectorId: string) => {
  multiCodeTestDetectorId.value = detectorId
  multiCodeTestStartDate.value = dayjs().subtract(1, 'year').format('YYYY-MM-DD')
  multiCodeTestSelectedStockList.value = []
  multiCodeTestStockList.value = []
  multiCodeTestVisible.value = true

  await nextTick()
  multiCodeTestStockTableRef.value?.clearSelection()
  await loadMultiCodeTestStockList()
}

const submitSingleDetectorMultiCodeTest = async () => {
  if (!multiCodeTestStartDate.value) {
    ElMessage.warning('请选择开始日期')
    return
  }

  if (!multiCodeTestSelectedStockList.value.length) {
    ElMessage.warning('请选择股票')
    return
  }

  multiCodeTestSubmitting.value = true
  try {
    const res = await apiSingleDetectorMultiCodeTest({
      codeList: multiCodeTestSelectedStockList.value.map(item => item.code),
      startDate: dayjs(multiCodeTestStartDate.value).format('YYYYMMDD'),
      detectorId: multiCodeTestDetectorId.value
    })
    backTestResultList.value = res.data
    multiCodeTestVisible.value = false
    backTestDialogVisible.value = true
  } finally {
    multiCodeTestSubmitting.value = false
  }
}

function handleOpen() {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

const handleOperation = (code: string, value?: string | string[], row?: CustomDetector) => {
  switch (code) {
    case 'detail':
      openDetail(value as string)
      break
    case 'create':
    case 'update':
      openForm(value as string)
      break
    case 'remove':
      remove(value as string, row?.templateIdLabel)
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
      queryParam[queryKey as keyof CustomDetector] = query[queryKey] as any
    }

    onSearch()
  })
}

router.currentRoute.value.meta.keepAlive ? onActivated(activated) : activated()
</script>

<template>
  <div class="list-page">
    <el-space wrap class="list-operation">
      <el-button v-has-permission="'create'" type="primary" :icon="Plus" @click="handleOperation('create')">
        新建
      </el-button>
      <excel-export
        v-has-permission="'export'"
        title="导出"
        :build-param="() => ({ ...buildQueryParam(), ids: selectedKeys })"
        :export-url="`${baseApi}/excel/export`"
        :table-head-url="`${baseApi}/excel/export-table-head`"
      />

      <el-space>
        <span class="search">
          <el-select v-model="queryParam.templateId" placeholder="模板" filterable clearable @change="onSearch">
            <el-option v-for="item in relatedData.templateIdOptions" :key="item.value" v-bind="item">
              <div v-if="typeof item.ext === 'string'" class="option">
                {{ item.label }}
                <span class="ext">（{{ item.ext }}）</span>
              </div>
            </el-option>
          </el-select>
        </span>
        <el-button :icon="Search" type="primary" @click="onSearch">查询</el-button>
        <el-button title="重置查询条件" @click="resetFilter">重置</el-button>
      </el-space>
    </el-space>

    <el-table
      ref="tableRef"
      v-loading="loading"
      class="list-body"
      :data="dataList"
      height="100%"
      stripe
      row-key="id"
      style="border-top: 1px solid var(--el-border-color-lighter)"
      @row-dblclick="(row: CustomDetector) => checkPermission('detail') && handleOperation('detail', row.id)"
      @selection-change="(arr: Array<CustomDetector>) => (selectedKeys = arr.map(e => `${e.id}`))"
      @sort-change="sortChange"
    >
      <el-table-column type="selection" width="55" fixed />
      <el-table-column type="index" width="50" fixed label="#" />
      <el-table-column label="模板" prop="templateIdLabel" show-overflow-tooltip />
      <el-table-column label="配置参数" prop="configParam" show-overflow-tooltip />
      <el-table-column label="展示名称" prop="displayName" show-overflow-tooltip />
      <el-table-column label="是否启用" prop="isEnable" sortable="custom" width="120" show-overflow-tooltip>
        <template #default="{ row }: { row: CustomDetector }">
          {{ row.isEnable ? '是' : '否' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }: { row: CustomDetector }">
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
            <el-button @click="singleDetectorMultiCodeTest(row.id)">多股票回测</el-button>

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

  <el-dialog v-model="multiCodeTestVisible" title="多股票回测" width="720px" draggable>
    <el-form label-width="80px">
      <el-form-item label="开始日期" required>
        <el-date-picker
          v-model="multiCodeTestStartDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择开始日期"
          style="width: 220px"
        />
      </el-form-item>

      <el-form-item label="股票列表" required>
        <div class="stock-selector">
          <el-table
            ref="multiCodeTestStockTableRef"
            v-loading="multiCodeTestLoading"
            :data="multiCodeTestStockList"
            row-key="code"
            height="360"
            border
            @selection-change="(arr: SimpleStockInfo[]) => (multiCodeTestSelectedStockList = arr)"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="名称" prop="name" show-overflow-tooltip />
            <el-table-column label="编码" prop="code" width="180" show-overflow-tooltip />
          </el-table>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="multiCodeTestVisible = false">取消</el-button>
      <el-button type="primary" :loading="multiCodeTestSubmitting" @click="submitSingleDetectorMultiCodeTest">
        确认
      </el-button>
    </template>
  </el-dialog>

  <BackTestDialog v-model="backTestDialogVisible" :data="backTestResultList" @open="handleOpen" />
</template>

<style scoped lang="scss">
.option {
  display: flex;
  justify-content: space-between;

  .ext {
    font-size: var(--el-font-size-extra-small);
    color: var(--el-text-color-secondary);
  }
}

.stock-selector {
  width: 100%;
}

.stock-selector-search {
  width: 320px;
  margin-bottom: 12px;
}
</style>
