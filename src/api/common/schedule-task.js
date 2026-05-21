import { api } from '@/utils/request'

const baseUrl = '/common/schedule-task'

export function apiRunTaskManually(id) {
  return api.get(baseUrl + '/run-task-manually', {
    id: id
  })
}
