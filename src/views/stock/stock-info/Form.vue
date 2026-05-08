<script setup lang="ts">
import type { FormInstance, FormValidateCallback } from 'element-plus'
import type { StockInfo } from './type'

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

const baseApi = '/stock/stock-info'

const { loadData, loading, model } = useDetail<StockInfo>(baseApi, {
  isFollowed: false
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
    if (model.value.id === id && !refresh) return
    // 加载数据
    loadData(id).then(() => {
      if (!id) {
        if (initData) Object.keys(initData).forEach(key => (model.value[key as keyof StockInfo] = initData[key] as any))
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
        <el-form-item prop="name" label="名称">
          <el-input v-model="model.name" :disabled="disabledProps?.includes('name')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('code')" :span="12">
        <el-form-item prop="code" label="编码" :rules="{ required: true, message: '不能为空', whitespace: true }">
          <el-input v-model="model.code" :disabled="disabledProps?.includes('code')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('extraInfo')" :span="12">
        <el-form-item prop="extraInfo" label="额外">
          <el-input
            v-model="model.extraInfo"
            :disabled="disabledProps?.includes('extraInfo')"
            clearable
            type="textarea"
            autosize
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('section')" :span="12">
        <el-form-item prop="section" label="板块">
          <el-input v-model="model.section" :disabled="disabledProps?.includes('section')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('info')" :span="12">
        <el-form-item prop="info" label="信息">
          <el-input v-model="model.info" :disabled="disabledProps?.includes('info')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('exchange')" :span="12">
        <el-form-item prop="exchange" label="交易所">
          <el-input v-model="model.exchange" :disabled="disabledProps?.includes('exchange')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('source')" :span="12">
        <el-form-item prop="source" label="来源">
          <el-input v-model="model.source" :disabled="disabledProps?.includes('source')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('latestDataFreshTime')" :span="12">
        <el-form-item prop="latestDataFreshTime" label="最新数据更新时间">
          <el-date-picker
            v-model="model.latestDataFreshTime"
            :disabled="disabledProps?.includes('latestDataFreshTime') || !!model.id"
            clearable
            type="date"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('isFollowed')" :span="12">
        <el-form-item prop="isFollowed" label="是否关注">
          <el-switch v-model="model.isFollowed" :disabled="disabledProps?.includes('isFollowed')" />
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
