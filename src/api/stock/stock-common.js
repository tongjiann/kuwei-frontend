import { api } from '@/utils/request'

const baseUrl = '/stock/common'

export function apiSyncDailyInfo(stockId) {
  return api.get(baseUrl + '/sync-daily-info', {
    ...(stockId && { stockId })
  })
}

export function apiMultiTest(params) {
  return api.get(baseUrl + '/multi-test', params)
}
