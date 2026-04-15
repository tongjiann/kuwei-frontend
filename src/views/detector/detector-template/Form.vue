<script setup lang="ts">
import type { FormInstance, FormValidateCallback } from 'element-plus'
import type { DetectorTemplate } from './type'

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

const baseApi = '/detector/detector-template'

const { loadData, loading, model } = useDetail<DetectorTemplate>(baseApi)

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
    if (model.value.id === id && !refresh) return
    // 加载数据
    loadData(id).then(() => {
      if (!id) {
        if (initData)
          Object.keys(initData).forEach(key => (model.value[key as keyof DetectorTemplate] = initData[key] as any))
      }
    })
  },
  validate,
  getData: async (relatedLabel = false) => {
    const data: Record<string, unknown> = _.cloneDeep(model.value)
    if (!relatedLabel) return data
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
      <el-col v-if="!invisibleProps?.includes('name')" :span="12">
        <el-form-item prop="name" label="名称" :rules="{ required: true, message: '不能为空', whitespace: true }">
          <el-input v-model="model.name" :disabled="disabledProps?.includes('name')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('description')" :span="12">
        <el-form-item prop="description" label="描述">
          <el-input v-model="model.description" :disabled="disabledProps?.includes('description')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('parameterCount')" :span="12">
        <el-form-item prop="parameterCount" label="参数数量">
          <el-input-number
            v-model="model.parameterCount"
            :disabled="disabledProps?.includes('parameterCount')"
            step-strictly
          />
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
