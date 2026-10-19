import { ElNotification } from 'element-plus'

export const notifyFailure = message => {
  ElNotification.closeAll()
  ElNotification({ title: '操作未完成', message, type: 'warning', position: 'top-right', duration: 4000 })
}

export const operationFeedback = (error, success = '') => {
  if (error) notifyFailure(error)
  return error || success
}
