import Decimal from 'decimal.js'

export interface TradeDetail {
  code?: string

  /**
   * 买 / 卖（建议前端也统一 enum）
   */
  action?: '买' | '卖'

  price?: Decimal

  quantity?: Decimal

  amount?: Decimal

  pnl?: Decimal

  description?: string

  /**
   * LocalDate -> string
   * 格式：YYYY-MM-DD
   */
  date?: string
}
