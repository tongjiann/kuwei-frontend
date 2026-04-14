import { api } from '@/utils/request'

const baseUrl = '/stock/stock-daily-info/'

export function apiGetKLineDataByStockId(stockId) {
  return api.get(baseUrl + 'get-k-line-data-by-stock-id', {
    stockId
  })
}
