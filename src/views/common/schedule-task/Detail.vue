<script setup lang="ts">
import type { ScheduleTask } from './type'

const baseApi = '/common/schedule-task'

const { loadData, loading, model } = useDetail<ScheduleTask>(baseApi)

defineExpose({ init: loadData })
</script>

<template>
  <el-empty v-if="!Object.keys(model).length" v-loading="loading" />
  <el-descriptions v-else v-loading="loading" :column="2" border>
    <el-descriptions-item label="主题" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.topic }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="详情" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.detail }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="重要程度" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.importanceLevel }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="CRON表达式" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.cronExpression }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="任务类型" label-class-name="item-label" label-align="right">
      <el-tag v-if="model.taskTypeLabel" :color="model.taskTypeLabel.ext?.color" effect="dark" type="info">
        {{ model.taskTypeLabel?.label }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="执行类型" label-class-name="item-label" label-align="right">
      <el-tag v-if="model.executionTypeLabel" :color="model.executionTypeLabel.ext?.color" effect="dark" type="info">
        {{ model.executionTypeLabel?.label }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="下次执行时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.nextExecutionTime }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="上次执行时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.lastExecutionTime }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="最大执行次数" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.maxExecutionTimes }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="当前已执行次数" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.currentExecutedTimes }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="开始执行时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.startExecutionTime }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="结束执行时间" label-class-name="item-label" label-align="right">
      <span class="txt-short">
        {{ model.endExecutionTime }}
      </span>
    </el-descriptions-item>
    <el-descriptions-item label="任务状态" label-class-name="item-label" label-align="right">
      <el-tag v-if="model.taskStatusLabel" :color="model.taskStatusLabel.ext?.color" effect="dark" type="info">
        {{ model.taskStatusLabel?.label }}
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
