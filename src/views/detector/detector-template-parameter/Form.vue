<script setup lang="ts">
import type { FormInstance, FormValidateCallback } from 'element-plus'
import type { DetectorTemplateParameter } from './type'

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

const baseApi = '/detector/detector-template-parameter'

const { initRelatedData, relatedData } = useOption({
  dict: ['PARAM_TYPE'],
  load: {
    templateIdOptions: { type: 'DetectorTemplate', label: 'name' }
  }
})

const { loadData, loading, model } = useDetail<DetectorTemplateParameter>(baseApi)

const { submitting, submit } = useForm({ baseApi, successCallback: (id, isNew) => emit('complete', id, isNew) })
watch(submitting, value => emit('submitting', value))

//  表单
const formRef = ref<FormInstance>()

const validate = (
  callback = (valid: boolean) => !valid && ElMessage.error({ message: '表单校验不通过', grouping: true })
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
          Object.keys(initData).forEach(
            key => (model.value[key as keyof DetectorTemplateParameter] = initData[key] as any)
          )
      }
    })
  },
  validate,
  getData: async (relatedLabel = false) => {
    const data: Record<string, unknown> = _.cloneDeep(model.value)
    if (!relatedLabel) return data
    if ((data.templateId as string)?.length) {
      const options = relatedData.templateIdOptions
      data.templateIdLabel = options.find(e => e.value === data.templateId)?.label
    } else data.templateIdLabel = undefined

    data.typeLabel = relatedData.paramTypeOptions.find(e => e.value === data.type)
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
      <el-col v-if="!invisibleProps?.includes('templateId')" :span="12">
        <el-form-item prop="templateId" label="模板" :rules="{ required: true, message: '不能为空', whitespace: true }">
          <el-select v-model="model.templateId" :disabled="disabledProps?.includes('templateId')" filterable clearable>
            <el-option v-for="item in relatedData.templateIdOptions" :key="item.value" v-bind="item">
              <div v-if="typeof item.ext === 'string'" class="option">
                {{ item.label }}
                <span class="ext">（{{ item.ext }}）</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('parameterName')" :span="12">
        <el-form-item
          prop="parameterName"
          label="名称"
          :rules="{ required: true, message: '不能为空', whitespace: true }"
        >
          <el-input v-model="model.parameterName" :disabled="disabledProps?.includes('parameterName')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('code')" :span="12">
        <el-form-item prop="code" label="编码" :rules="{ required: true, message: '不能为空', whitespace: true }">
          <el-input v-model="model.code" :disabled="disabledProps?.includes('code')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('index')" :span="12">
        <el-form-item prop="index" label="序号" :rules="{ required: true, message: '不能为空' }">
          <el-input-number v-model="model.index" :disabled="disabledProps?.includes('index')" :min="1" step-strictly />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('type')" :span="12">
        <el-form-item prop="type" label="类型" :rules="{ required: true, message: '不能为空', whitespace: true }">
          <el-select v-model="model.type" :disabled="disabledProps?.includes('type')" filterable clearable>
            <el-option v-for="item in relatedData.paramTypeOptions" :key="item.value" v-bind="item" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('defaultValue')" :span="12">
        <el-form-item prop="defaultValue" label="默认值">
          <el-input-number
            v-model="model.defaultValue"
            :disabled="disabledProps?.includes('defaultValue')"
            :precision="2"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('description')" :span="12">
        <el-form-item prop="description" label="说明">
          <el-input v-model="model.description" :disabled="disabledProps?.includes('description')" clearable />
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
