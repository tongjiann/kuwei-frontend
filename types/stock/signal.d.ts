import Decimal from 'decimal.js'

export interface Signal {
  /**
   * 0=买, 1=卖
   */
  sign?: 0 | 1

  /**
   * 股票编码
   */
  code?: string

  /**
   * 信号强度（0-1）
   */
  strength?: Decimal

  /**
   * 操作时间（LocalDateTime）
   * 建议使用 ISO 字符串：YYYY-MM-DDTHH?:mm?:ss
   */
  dateTime?: string

  /**
   * 触发价格
   */
  price?: Decimal

  /**
   * 描述信息
   */
  description?: string
}
