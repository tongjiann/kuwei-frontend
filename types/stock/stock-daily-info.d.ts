/**
* 股票每日信息
*/
export interface StockDailyInfo {
    // 唯一标识
    id: string
    // 股票id
    stockId?: string
    stockIdLabel?: string
    // 日期
    date?: string
    // 时间
    time?: string
    // 昨日收盘价
    yesterdayClosePrice?: number
    // 开盘价
    openPrice?: number
    // 今日收盘价
    todayClosePrice?: number
    // 最高价
    highPrice?: number
    // 最低价
    lowPrice?: number
    // 成交额
    tradingVolume?: number
    // 成交量
    turnover?: number
    // 涨跌额
    changePrice?: number
    // 涨跌幅
    changePercentage?: number
    // 换手率
    turnoverRate?: number
    // 量比
    volumeRatio?: number
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