<script setup lang="ts">
import type { FormInstance, FormValidateCallback } from 'element-plus'
import type { CustomDetector } from './type'

import useAuthStore from '@/store/auth'
import { apiList } from '@/api/detector/detector-template-parameter'

const authStore = useAuthStore()

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
// ================= 配置参数弹窗 =================
const configDialogVisible = ref(false)
const configForm = ref<Record<string, any>>({})
const configSchema = ref<any[]>([])

// ===== 类型安全处理 =====
const parseValue = (val: any, type: string) => {
  if (val === undefined || val === null || val === '') {
    return type === '1' || type === '2' ? 0 : ''
  }
  if (type === '1') {
    const v = Number.parseInt(val)
    return Number.isNaN(v) ? 0 : v
  }
  if (type === '2') {
    const v = Number.parseFloat(val)
    return Number.isNaN(v) ? 0 : v
  }
  return val
}

// ===== 解析范围（如 0-1）=====
const parseRange = (desc?: string) => {
  if (!desc || !desc.includes('-')) return {}
  const [min, max] = desc.split('-').map(Number)
  return { min, max }
}

// ===== 数值组件控制（核心优化）=====
const getNumberProps = (item: any) => {
  const range = parseRange(item.placeholder)

  if (item.type === '1') {
    return { ...range, step: 1, precision: 0 }
  }
  if (item.type === '2') {
    return { ...range, step: 0.1, precision: 4 }
  }
  return {}
}

// ===== 加载配置 =====
const loadConfigSchema = async () => {
  if (!model.value.templateId) {
    ElMessage.warning('请先选择模板')
    return
  }

  try {
    const raw = await apiList(model.value.templateId)

    const dataList = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []

    if (!dataList.length) {
      ElMessage.warning('该模板没有配置参数')
      return
    }

    const list = dataList.sort((a, b) => Number(a.index) - Number(b.index))

    configSchema.value = list
      .filter(item => item.code)
      .map(item => ({
        field: item.code,
        label: item.parameterName,
        type: item.type,
        defaultValue: item.defaultValue,
        placeholder: item.description
      }))

    const obj: Record<string, any> = {}

    // 回显
    if (model.value.configParam) {
      try {
        const parsed = JSON.parse(model.value.configParam)
        if (parsed && typeof parsed === 'object') {
          Object.assign(obj, parsed)
        }
      } catch (e) {
        console.warn('configParam 解析失败', e)
      }
    }

    // 默认值
    configSchema.value.forEach(item => {
      if (!(item.field in obj)) {
        obj[item.field] = parseValue(item.defaultValue, item.type)
      }
    })

    configForm.value = obj
    configDialogVisible.value = true
  } catch (e: any) {
    console.error(e)
    ElMessage.error('加载配置失败')
  }
}

// ===== 确认 =====
const confirmConfig = () => {
  model.value.configParam = JSON.stringify(configForm.value)
  configDialogVisible.value = false
}

const baseApi = '/detector/custom-detector'

const { initRelatedData, relatedData } = useOption({
  dict: ['TRUE_FALSE_DIC'],
  load: {
    templateIdOptions: { type: 'DetectorTemplate', label: 'name' },
    relatedAccountIdOptions: { type: 'IamUser', label: 'realname' }
  }
})

const { loadData, loading, model } = useDetail<CustomDetector>(baseApi, {
  relatedAccountId: authStore.info?.id
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
          Object.keys(initData).forEach(key => (model.value[key as keyof CustomDetector] = initData[key] as any))
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
    if ((data.relatedAccountId as string)?.length) {
      const options = relatedData.relatedAccountIdOptions
      data.relatedAccountIdLabel = options.find(e => e.value === data.relatedAccountId)?.label
    } else data.relatedAccountIdLabel = undefined

    data.isEnableLabel = relatedData.trueFalseDicOptions.find(e => e.value === data.isEnable)
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
        <el-form-item prop="templateId" label="模板">
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

      <!-- 配置参数 -->
      <el-col :span="12">
        <el-form-item label="配置参数">
          <el-input v-model="model.configParam" disabled placeholder="点击配置">
            <template #append>
              <el-button @click="loadConfigSchema">配置</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('displayName')" :span="12">
        <el-form-item prop="displayName" label="展示名称">
          <el-input v-model="model.displayName" :disabled="disabledProps?.includes('displayName')" clearable />
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('relatedAccountId')" :span="12">
        <el-form-item prop="relatedAccountId" label="创建者">
          <el-select
            v-model="model.relatedAccountId"
            :disabled="disabledProps?.includes('relatedAccountId')"
            filterable
            clearable
          >
            <el-option v-for="item in relatedData.relatedAccountIdOptions" :key="item.value" v-bind="item">
              <div v-if="typeof item.ext === 'string'" class="option">
                {{ item.label }}
                <span class="ext">（{{ item.ext }}）</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="!invisibleProps?.includes('isEnable')" :span="12">
        <el-form-item prop="isEnable" label="是否启用">
          <el-select v-model="model.isEnable" :disabled="disabledProps?.includes('isEnable')" filterable clearable>
            <el-option v-for="item in relatedData.trueFalseDicOptions" :key="item.value" v-bind="item" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <el-dialog v-model="configDialogVisible" title="配置参数" width="500px">
    <el-form :model="configForm" label-width="110px">
      <el-form-item v-for="item in configSchema" :key="item.field" :label="item.label">
        <!-- 数值类型 -->
        <el-input-number
          v-if="item.type === '1' || item.type === '2'"
          v-model="configForm[item.field]"
          v-bind="getNumberProps(item)"
          :placeholder="item.placeholder"
          controls-position="right"
          style="width: 100%"
        />

        <!-- 文本类型 -->
        <el-input v-else v-model="configForm[item.field]" :placeholder="item.placeholder" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="configDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmConfig">确定</el-button>
    </template>
  </el-dialog>
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
