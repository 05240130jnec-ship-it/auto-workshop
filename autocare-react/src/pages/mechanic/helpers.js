export const STATUS_LABEL = { pending: 'Pending', progress: 'In Progress', complete: 'Complete', cancelled: 'Cancelled' }
export const STATUS_ICON = { pending: 'm-icon-orange', progress: 'm-icon-blue', complete: 'm-icon-green', cancelled: 'm-icon-purple' }

// days between two ISO dates
export function daysBetween(a, b) {
  return Math.max(0, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000))
}
