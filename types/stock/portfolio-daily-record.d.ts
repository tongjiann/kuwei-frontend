import Decimal from 'decimal.js'

export interface PortfolioDailyRecord {
  /**
   * LocalDate -> string (YYYY-MM-DD)
   */
  date?: string

  cash?: Decimal

  totalAsset?: Decimal

  totalPositionValue?: Decimal

  positionMap?: Record<string, PositionInfo>

  tradeList?: TradeDetail[]

  signalList?: Signal[]
}
