<script setup lang="ts">
import type { DetectorTemplate } from './type'

const baseApi = '/detector/detector-template'

const { loadData, loading, model } = useDetail<DetectorTemplate>(baseApi)

defineExpose({ init: loadData })
</script>

<template>
  <el-empty v-if="!Object.keys(model).length" v-loading="loading" />
  <el-descriptions v-else v-loading="loading" :column="2" border>
    <el-descriptions-item label="名称" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.name }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="描述" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.description }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="参数数量" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.parameterCount }}
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
