<script setup lang="ts">
import type { DetectorTemplateParameter } from './type'

const baseApi = '/detector/detector-template-parameter'

const { loadData, loading, model } = useDetail<DetectorTemplateParameter>(baseApi)

defineExpose({ init: loadData })
</script>

<template>
  <el-empty v-if="!Object.keys(model).length" v-loading="loading" />
  <el-descriptions v-else v-loading="loading" :column="2" border>
    <el-descriptions-item label="模板" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.templateIdLabel }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="名称" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.parameterName }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="编码" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.code }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="序号" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.index }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="类型" label-class-name="item-label" label-align="right">
      <el-tag v-if="model.typeLabel" :color="model.typeLabel.ext?.color" effect="dark" type="info">
        {{ model.typeLabel?.label }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="默认值" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.defaultValue }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="说明" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.description }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="创建人" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.createByLabel }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="创建时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.createTime }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="更新人" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.updateByLabel }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="更新时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.updateTime }}
      </span>
    </el-descriptions-item>
  </el-descriptions>
</template>

<style scoped lang="scss">
.el-descriptions {
  :deep(.el-descriptions__header) {
    margin: 0 10px 12px;
  }

  :deep(.item-label) {
    width: 120px;
  }
}
</style>
