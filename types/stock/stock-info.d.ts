/**
* 股票基础信息
*/
export interface StockInfo {
    // 唯一标识
    id: string
    // 名称
    name?: string
    // 编码
    code: string
    // 额外
    extraInfo?: string
    // 板块
    section?: string
    // 信息
    info?: string
    // 交易所
    exchange?: string
    // 来源
    source?: string
    // 最新数据更新时间
    latestDataFreshTime?: string
    // 数据起始时间
    dataStartTime?: string
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
