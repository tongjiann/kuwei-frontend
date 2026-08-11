import { api } from '@/utils/request'

const baseUrl = '/stock/stock-daily-info/'

export function apiGetKLineDataByStockId(stockId) {
  return api.get(baseUrl + 'get-k-line-data-by-stock-id', {
    stockId
  })
}

export function apiGetVolumeProfile(params) {
  return api.get(baseUrl + 'volume-profile', params)
}

export function apiGetTrendPriceLevels(params) {
  return api.get(baseUrl + 'trend-price-levels', params)
}
