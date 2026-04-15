<script setup lang="ts" name="DetectorTemplateParameter">
import { Plus, Edit, Search, ArrowDown } from '@element-plus/icons-vue'
import type { DetectorTemplateParameter } from './type'
import ExcelExport from '@/components/excel/Export.vue'
import Detail from '@/views/detector/detector-template-parameter/Detail.vue'
import Form from '@/views/detector/detector-template-parameter/Form.vue'

import { ElTable } from 'element-plus'

import { checkPermission } from '@/utils/permission'

const baseApi = '/detector/detector-template-parameter'

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
} = useList<DetectorTemplateParameter>({ baseApi, initQueryParam: {} })

defineExpose({
  refresh: onSearch,
  addCondition: (key: keyof DetectorTemplateParameter, value: any, refresh = false) => {
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

const handleOperation = (code: string, value?: string | string[], row?: DetectorTemplateParameter) => {
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

const sum = (prop: keyof DetectorTemplateParameter, fractionDigits?: number) =>
  Number(
    (dataList ?? [])
      .map(e => Number(e[prop] ?? 0))
      .reduce((e1, e2) => e1 + e2, 0)
      .toFixed(fractionDigits)
  )

const ave = (prop: keyof DetectorTemplateParameter, fractionDigits?: number) =>
  Number(
    ((dataList ?? []).map(e => Number(e[prop] ?? 0)).reduce((e1, e2) => e1 + e2, 0) / (dataList ?? []).length).toFixed(
      fractionDigits
    )
  )

const refreshData = (haveNewData?: boolean) => {
  haveNewData ? onSearch() : getList()
}

const router = useRouter()

const activated = () => {
  nextTick(() => {
    const query = router.currentRoute.value.query
    for (const queryKey in query) {
      queryParam[queryKey as keyof DetectorTemplateParameter] = query[queryKey] as any
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
      <el-button
        v-has-permission="'delete'"
        type="danger"
        :disabled="!selectedKeys.length"
        @click="handleOperation('batchRemove', selectedKeys)"
      >
        批量删除
      </el-button>

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
      @row-dblclick="(row: DetectorTemplateParameter) => checkPermission('detail') && handleOperation('detail', row.id)"
      @selection-change="(arr: Array<DetectorTemplateParameter>) => (selectedKeys = arr.map(e => `${e.id}`))"
      @sort-change="sortChange"
    >
      <el-table-column type="selection" width="55" fixed />
      <el-table-column
        label="模板"
        prop="templateIdLabel"
        sortable="custom"
        sort-by="templateId"
        show-overflow-tooltip
      />
      <el-table-column label="名称" prop="parameterName" show-overflow-tooltip />
      <el-table-column label="编码" prop="code" show-overflow-tooltip />
      <el-table-column label="序号" prop="index" sortable="custom" show-overflow-tooltip>
        <template #header>
          <el-tooltip placement="bottom">
            <template #content>
              当前页总和：{{ sum('index', 2) }}<br />
              当前页平均：{{ ave('index', 3) }}
            </template>
            序号
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="typeLabel" show-overflow-tooltip>
        <template #default="{ row }: { row: DetectorTemplateParameter }">
          <el-tag
            v-if="row.typeLabel"
            effect="dark"
            type="info"
            :color="(row.typeLabel as LabelValue<{ color?: string }>).ext?.color"
          >
            {{ (row.typeLabel as LabelValue).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="默认值" prop="defaultValue" show-overflow-tooltip>
        <template #header>
          <el-tooltip placement="bottom">
            <template #content>
              当前页总和：{{ sum('defaultValue', 2) }}<br />
              当前页平均：{{ ave('defaultValue', 3) }}
            </template>
            默认值
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="说明" prop="description" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" :width="180">
        <template #default="{ row }: { row: DetectorTemplateParameter }">
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
</style>
