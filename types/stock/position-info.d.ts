import Decimal from 'decimal.js'

export interface PositionInfo {
  code?: string
  name?: string

  maxPosition?: Decimal

  position?: Decimal      // 持仓股数
  avgCost?: Decimal       // 平均成本
  totalCost?: Decimal     // 总成本

  price?: Decimal         // 当日价格
  positionValue?: Decimal // 市值
}
