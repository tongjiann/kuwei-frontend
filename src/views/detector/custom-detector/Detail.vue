<script setup lang="ts">
import type { CustomDetector } from './type'

const baseApi = '/detector/custom-detector'

const { loadData, loading, model } = useDetail<CustomDetector>(baseApi)

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
    <el-descriptions-item label="配置参数" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.configParam }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="展示名称" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.displayName }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="创建者" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.relatedAccountIdLabel }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="是否启用" label-class-name="item-label" label-align="right">
      <el-tag v-if="model.isEnableLabel" :color="model.isEnableLabel.ext?.color" effect="dark" type="info">
        {{ model.isEnableLabel?.label }}
      </el-tag>
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
