/**
* 定时任务
*/
export interface ScheduleTask {
    // 唯一标识
    id: string
    // 主题
    topic?: string
    // 详情
    detail?: string
    // 重要程度
    importanceLevel?: number
    // CRON表达式
    cronExpression?: string
    // 任务类型
    taskType?: string
    taskTypeLabel?: LabelValue<{ color?: string }>
    // 执行类型
    executionType?: string
    executionTypeLabel?: LabelValue<{ color?: string }>
    // 下次执行时间
    nextExecutionTime?: string
    // 上次执行时间
    lastExecutionTime?: string
    // 最大执行次数
    maxExecutionTimes?: number
    // 当前已执行次数
    currentExecutedTimes?: number
    // 开始执行时间
    startExecutionTime?: string
    // 结束执行时间
    endExecutionTime?: string
    // 任务状态
    taskStatus?: string
    taskStatusLabel?: LabelValue<{ color?: string }>
    // 创建人
    createBy?: string
    createByLabel?: string
    // 创建时间
    createTime?: string
    // 更新人
    updateBy?: string
    updateByLabel?: string
    // 更新时间
    updateTime?: string
}