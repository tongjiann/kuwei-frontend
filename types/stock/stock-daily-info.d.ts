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
/**
 * 成交量分布 价格档
 */
export interface VolumeProfileLevel {
  // 档起始价格（含）
  priceFrom?: number
  // 档结束价格（不含，最后一档含）
  priceTo?: number
  // 该档总成交量
  totalVolume?: number
  // 上涨K线成交量
  upVolume?: number
  // 下跌K线成交量
  downVolume?: number
}

/**
 * 自动锚定成交量分布
 */
export interface VolumeProfile {
  // 锚定区间起始日期
  anchorStartDate?: string
  // 锚定区间截止日期
  anchorEndDate?: string
  // 锚定区间最低价
  priceLow?: number
  // 锚定区间最高价
  priceHigh?: number
  // 锚定区间总成交量
  totalVolume?: number
  // 成交量最大价格（POC）
  pocPrice?: number
  // 价值区域上沿（VAH）
  valueAreaHigh?: number
  // 价值区域下沿（VAL）
  valueAreaLow?: number
  // 价格档分布
  levels?: VolumeProfileLevel[]
}

/**
 * K线趋势线
 */
export interface TrendLine {
  // 趋势段类型：RISING_TREND、FALLING_TREND
  lineType?: string
  // 起点摆动锚点
  startDate?: string
  startPrice?: number
  // 终点摆动锚点
  endDate?: string
  endPrice?: number
}

/**
 * 高频触碰价位
 */
export interface FrequentPriceLevel {
  // 价位类型：SUPPORT、RESISTANCE
  levelType?: string
  // 合并后的价格区间和代表价格
  priceFrom?: number
  priceTo?: number
  price?: number
  // 触碰次数与最近触碰日期
  touchCount?: number
  firstTouchDate?: string
  lastTouchDate?: string
}

/**
 * 趋势线与频繁价位分析结果
 */
export interface TrendPriceLevel {
  // 分析区间
  anchorStartDate?: string
  anchorEndDate?: string
  priceLow?: number
  priceHigh?: number
  latestClosePrice?: number
  trendLines?: TrendLine[]
  frequentLevels?: FrequentPriceLevel[]
}
