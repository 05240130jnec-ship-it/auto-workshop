// The words on the mechanic pages. They come from MySQL (admin → Mechanic Portal),
// so the admin can change them. These are only used while the settings are loading.
export const MECHANIC_TEXTS = {
  mPortalLabel: 'Mechanic portal',
  mDashTitle: 'Dashboard',
  mDashText: "Welcome back, {name} 👋 Here's your workload today.",
  mRepairsTitle: 'My Repairs',
  mRepairsText: 'All repair orders assigned to you',
  mPartsTitle: 'Parts Used',
  mPartsText: 'Every spare part you logged on your jobs',
  mReportsTitle: 'My Reports',
  mReportsText: 'Summary of your repair activities',
  mProfileTitle: 'My Profile',
  mProfileText: 'Manage your mechanic profile and availability',
  mMenuProfile: 'My profile',
  mMenuLogout: 'Log out',
  mNoteNew: 'New job assigned to you',
  mNoteToday: 'Car arrives today at {time}',
  mNoteLate: 'Job is overdue',
  mNoteEmpty: "No notifications. You're all caught up.",
  mTodayWaiting: '{count} job(s) waiting to start',
  mTodayDone: 'No jobs waiting. Great work!',
  mTodayStart: 'Start next job',
  mTodayContinue: 'Continue job',
}

// mt(settings, 'mDashText', { name: 'Ugyen' }) → "Welcome back, Ugyen 👋 …"
export function mt(settings, key, values = {}) {
  const text = (settings && settings[key]) || MECHANIC_TEXTS[key] || ''
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m))
}
