/**
* 识别器模板参数
*/
export interface DetectorTemplateParameter {
    // 唯一标识
    id: string
    // 模板
    templateId: string
    templateIdLabel?: string
    // 名称
    parameterName: string
    // 编码
    code: string
    // 序号
    index: number
    // 类型
    type: string
    typeLabel?: LabelValue<{ color?: string }>
    // 默认值
    defaultValue?: number
    // 说明
    description?: string
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