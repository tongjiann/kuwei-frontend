import Decimal from 'decimal.js'
import type { PortfolioDailyRecord } from '#/stock/portfolio-daily-record'

export interface PortfolioBackTestResult {
  startAsset: Decimal
  endAsset: Decimal
  returnRate: Decimal
  maxDrawDown: Decimal
  sharpeRatio: Decimal
  annualizedReturnRate: Decimal

  strategy: string

  // 后端忽略字段
  signalList?: Signal[]
  signalSize: int
  tradeDetailList?: TradeDetail[]
  tradeDetailSize: int
  portfolioDailyRecordList?: PortfolioDailyRecord[]
}
