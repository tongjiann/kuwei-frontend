<script setup lang="ts">
import type { StockInfo } from '#/stock/stock-info'

const baseApi = '/stock/stock-info'

const { loadData, loading, model } = useDetail<StockInfo>(baseApi)

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
    <el-descriptions-item label="编码" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.code }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="额外" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.extraInfo }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="板块" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.section }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="信息" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.info }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="交易所" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.exchange }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="来源" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.source }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="最新数据更新时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.latestDataFreshTime }}
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
