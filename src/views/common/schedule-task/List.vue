<script setup lang="ts" name="ScheduleTask">
import { Plus, Edit, Search, ArrowDown } from '@element-plus/icons-vue'
import type { ScheduleTask } from './type'
import Detail from '@/views/common/schedule-task/Detail.vue'
import Form from '@/views/common/schedule-task/Form.vue'

import { checkPermission } from '@/utils/permission'

const baseApi = '/common/schedule-task'

const { queryParam, loading, dataList, pagination, getList, onSearch, resetFilter, remove, batchRemove } =
  useList<ScheduleTask>({ baseApi, initQueryParam: {} })

defineExpose({
  refresh: onSearch,
  addCondition: (key: keyof ScheduleTask, value: any, refresh = false) => {
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

const handleOperation = (code: string, value?: string | string[], row?: ScheduleTask) => {
  switch (code) {
    case 'detail':
      openDetail(value as string)
      break
    case 'create':
    case 'update':
      openForm(value as string)
      break
    case 'remove':
      remove(value as string, row?.topic)
      break
    case 'batchRemove':
      batchRemove(value as string[])
      break
    default:
      throw new Error(`不存在的操作编码${code}!`)
  }
}

const sum = (prop: keyof ScheduleTask, fractionDigits?: number) =>
  Number(
    (dataList ?? [])
      .map(e => Number(e[prop] ?? 0))
      .reduce((e1, e2) => e1 + e2, 0)
      .toFixed(fractionDigits)
  )

const ave = (prop: keyof ScheduleTask, fractionDigits?: number) =>
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
      queryParam[queryKey as keyof ScheduleTask] = query[queryKey] as any
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

      <el-space>
        <span class="search">
          <el-input v-model="queryParam.topic" placeholder="主题" clearable @change="onSearch" />
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
      @row-dblclick="(row: ScheduleTask) => checkPermission('detail') && handleOperation('detail', row.id)"
      @sort-change="sortChange"
    >
      <el-table-column label="主题" prop="topic" show-overflow-tooltip />
      <el-table-column label="详情" prop="detail" show-overflow-tooltip />
      <el-table-column label="重要程度" prop="importanceLevel" show-overflow-tooltip>
        <template #header>
          <el-tooltip placement="bottom">
            <template #content>
              当前页总和：{{ sum('importanceLevel', 2) }}<br />
              当前页平均：{{ ave('importanceLevel', 3) }}
            </template>
            重要程度
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="CRON表达式" prop="cronExpression" show-overflow-tooltip />
      <el-table-column label="任务类型" prop="taskTypeLabel" show-overflow-tooltip>
        <template #default="{ row }: { row: ScheduleTask }">
          <el-tag
            v-if="row.taskTypeLabel"
            effect="dark"
            type="info"
            :color="(row.taskTypeLabel as LabelValue<{ color?: string }>).ext?.color"
          >
            {{ (row.taskTypeLabel as LabelValue).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行类型" prop="executionTypeLabel" show-overflow-tooltip>
        <template #default="{ row }: { row: ScheduleTask }">
          <el-tag
            v-if="row.executionTypeLabel"
            effect="dark"
            type="info"
            :color="(row.executionTypeLabel as LabelValue<{ color?: string }>).ext?.color"
          >
            {{ (row.executionTypeLabel as LabelValue).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下次执行时间" prop="nextExecutionTime" show-overflow-tooltip />
      <el-table-column label="上次执行时间" prop="lastExecutionTime" show-overflow-tooltip />
      <el-table-column label="最大执行次数" prop="maxExecutionTimes" show-overflow-tooltip>
        <template #header>
          <el-tooltip placement="bottom">
            <template #content>
              当前页总和：{{ sum('maxExecutionTimes', 2) }}<br />
              当前页平均：{{ ave('maxExecutionTimes', 3) }}
            </template>
            最大执行次数
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="当前已执行次数" prop="currentExecutedTimes" show-overflow-tooltip>
        <template #header>
          <el-tooltip placement="bottom">
            <template #content>
              当前页总和：{{ sum('currentExecutedTimes', 2) }}<br />
              当前页平均：{{ ave('currentExecutedTimes', 3) }}
            </template>
            当前已执行次数
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" prop="taskStatusLabel" show-overflow-tooltip>
        <template #default="{ row }: { row: ScheduleTask }">
          <el-tag
            v-if="row.taskStatusLabel"
            effect="dark"
            type="info"
            :color="(row.taskStatusLabel as LabelValue<{ color?: string }>).ext?.color"
          >
            {{ (row.taskStatusLabel as LabelValue).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" :width="180">
        <template #default="{ row }: { row: ScheduleTask }">
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

<style scoped lang="scss"></style>
