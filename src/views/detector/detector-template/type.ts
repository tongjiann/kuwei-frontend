/**
* 识别器模板
*/
export interface DetectorTemplate {
    // 唯一标识
    id: string
    // 名称
    name: string
    // 描述
    description?: string
    // 参数数量
    parameterCount?: number
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