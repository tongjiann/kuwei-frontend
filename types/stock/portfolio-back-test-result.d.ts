import Decimal from 'decimal.js'

export interface PortfolioDailyRecord {
  date?: string // LocalDate -> ISO string?: 'YYYY-MM-DD'

  cash?: Decimal
  totalAsset?: Decimal
  totalPositionValue?: Decimal

  positionMap?: Record<string, PositionInfo>

  tradeList?: TradeDetail[]
  signalList?: Signal[]
}
