<script setup lang="ts">
import type { FormInstance, FormValidateCallback } from 'element-plus'
import type { ScheduleTask } from './type'

defineProps<{
  // 禁用表单内的所有组件
  disabled?: boolean
  // 禁用属性列表（只读不可输入）
  disabledProps?: string[]
  // 不可见属性列表（忽略不加载）
  invisibleProps?: string[]
}>()

const emit = defineEmits<{
  (e: 'complete', id?: string, isNew?: boolean): void
  (e: 'submitting', submitting: boolean): void
}>()

const baseApi = '/common/schedule-task'

const { initRelatedData, relatedData } = useOption({
  dict: ['TASK_TYPE', 'EXE_TYPE', 'TASK_STATUS']
})

const { loadData, loading, model } = useDetail<ScheduleTask>(baseApi, {
  currentExecutedTimes: 0
})

const { submitting, submit } = useForm({ baseApi, successCallback: (id, isNew) => emit('complete', id, isNew) })
watch(submitting, value => emit('submitting', value))

//  表单
const formRef = ref<FormInstance>()

const validate = (
  callback = (valid: boolean) =>
    !valid &&
    ElMessage.error({
      message: '表单校验不通过',
      grouping: true
    })
) =>
  Promise.all([formRef.value].map(e => e?.validate?.(callback as any as FormValidateCallback)).filter(e => !!e))
    .then((arr: (boolean | undefined)[]) => arr.every(e => e))
    .catch(() => false)

defineExpose({
  init: (id?: string, refresh = true, initData?: Record<string, unknown>) => {
    // 初始化选项
    initRelatedData()
    if (model.value.id === id && !refresh) return
    // 加载数据
    loadData(id).then(() => {
      if (!id) {
        if (initData)
          Object.keys(initData).forEach(key => (model.value[key as keyof ScheduleTask] = initData[key] as any))
      }
    })
  },
  validate,
  getData: async (relatedLabel = false) => {
    const data: Record<string, unknown> = _.cloneDeep(model.value)
    if (!relatedLabel) return data

    data.taskTypeLabel = relatedData.taskTypeOptions.find(e => e.value === data.taskType)

    data.executionTypeLabel = relatedData.exeTypeOptions.find(e => e.value === data.executionType)

    data.taskStatusLabel = relatedData.taskStatusOptions.find(e => e.value === data.taskStatus)
    return data
  },
  submit: () => submit(model.value, formRef.value),
  reset: () => {
    formRef.value?.resetFields()
    model.value.id = void 0
  }
})
</script>

<template>
  <el-form ref="formRef" v-loading="loading" :model="model" label-width="90px" :disabled="disabled">
    <el-row :gutter="18">
      <el-col v-if="!invisibleProps?.includes('topic')" :span="12">
        <el-form-item prop="topic" label="主题">
          <el-input v-model="model.topic" :disabled="disabledProps?.includes('topic')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('detail')" :span="12">
        <el-form-item prop="detail" label="详情">
          <el-input v-model="model.detail" :disabled="disabledProps?.includes('detail')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('importanceLevel')" :span="12">
        <el-form-item prop="importanceLevel" label="重要程度">
          <el-input-number
            v-model="model.importanceLevel"
            :disabled="disabledProps?.includes('importanceLevel')"
            :min="1"
            :max="5"
            step-strictly
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('cronExpression')" :span="12">
        <el-form-item prop="cronExpression" label="CRON表达式">
          <el-input v-model="model.cronExpression" :disabled="disabledProps?.includes('cronExpression')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('taskType')" :span="12">
        <el-form-item prop="taskType" label="任务类型">
          <el-select v-model="model.taskType" :disabled="disabledProps?.includes('taskType')" filterable clearable>
            <el-option v-for="item in relatedData.taskTypeOptions" :key="item.value" v-bind="item" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('executionType')" :span="12">
        <el-form-item prop="executionType" label="执行类型">
          <el-select
            v-model="model.executionType"
            :disabled="disabledProps?.includes('executionType')"
            filterable
            clearable
          >
            <el-option v-for="item in relatedData.exeTypeOptions" :key="item.value" v-bind="item" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('nextExecutionTime')" :span="12">
        <el-form-item prop="nextExecutionTime" label="下次执行时间">
          <el-date-picker
            v-model="model.nextExecutionTime"
            :disabled="disabledProps?.includes('nextExecutionTime') || !!model.id"
            clearable
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('lastExecutionTime')" :span="12">
        <el-form-item prop="lastExecutionTime" label="上次执行时间">
          <el-date-picker
            v-model="model.lastExecutionTime"
            :disabled="disabledProps?.includes('lastExecutionTime') || !!model.id"
            clearable
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('maxExecutionTimes')" :span="12">
        <el-form-item prop="maxExecutionTimes" label="最大执行次数">
          <el-input-number
            v-model="model.maxExecutionTimes"
            :disabled="disabledProps?.includes('maxExecutionTimes')"
            step-strictly
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('currentExecutedTimes')" :span="12">
        <el-form-item prop="currentExecutedTimes" label="当前已执行次数">
          <el-input-number
            v-model="model.currentExecutedTimes"
            :disabled="disabledProps?.includes('currentExecutedTimes') || !!model.id"
            step-strictly
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('startExecutionTime')" :span="12">
        <el-form-item prop="startExecutionTime" label="开始执行时间">
          <el-date-picker
            v-model="model.startExecutionTime"
            :disabled="disabledProps?.includes('startExecutionTime') || !!model.id"
            clearable
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('endExecutionTime')" :span="12">
        <el-form-item prop="endExecutionTime" label="结束执行时间">
          <el-date-picker
            v-model="model.endExecutionTime"
            :disabled="disabledProps?.includes('endExecutionTime') || !!model.id"
            clearable
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('taskStatus')" :span="12">
        <el-form-item prop="taskStatus" label="任务状态">
          <el-select v-model="model.taskStatus" :disabled="disabledProps?.includes('taskStatus')" filterable clearable>
            <el-option v-for="item in relatedData.taskStatusOptions" :key="item.value" v-bind="item" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
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
