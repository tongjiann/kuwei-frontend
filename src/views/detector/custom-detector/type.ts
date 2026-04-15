/**
 * 自定义识别器
 */
export interface CustomDetector {
  // 唯一标识
  id: string
  // 模板
  templateId?: string
  templateIdLabel?: string
  // 配置参数
  configParam?: string
  // 展示名称
  displayName?: string
  // 创建者
  relatedAccountId?: string
  relatedAccountIdLabel?: string
  // 是否启用
  isEnable?: string
  isEnableLabel?: LabelValue<{ color?: string }>
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
