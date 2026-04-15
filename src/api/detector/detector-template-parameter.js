import { api } from '@/utils/request'

const baseUrl = '/detector/detector-template-parameter'

export function apiList(templateId) {
  return api.get(baseUrl, {
    ...(templateId && { templateId: templateId })
  })
}
