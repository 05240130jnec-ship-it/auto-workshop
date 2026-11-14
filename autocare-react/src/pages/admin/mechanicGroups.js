// The texts of the mechanic portal, grouped for the admin page "Mechanic Portal".
// Each field = one row in the MySQL table `settings`.
export const MECHANIC_GROUPS = [
  {
    key: 'pages', label: 'Page titles', icon: 'bi-layout-text-window',
    fields: [
      { name: 'mPortalLabel', label: 'Sidebar: small text under the logo', required: true },
      { name: 'mDashTitle', label: 'Dashboard: title', required: true, help: 'Also the menu name' },
      { name: 'mDashText', label: 'Dashboard: welcome text', required: true, col: 12, help: '{name} = the mechanic’s name' },
      { name: 'mRepairsTitle', label: 'My Repairs: title', required: true, help: 'Also the menu name' },
      { name: 'mRepairsText', label: 'My Repairs: text under the title' },
      { name: 'mPartsTitle', label: 'Parts Used: title', required: true, help: 'Also the menu name' },
      { name: 'mPartsText', label: 'Parts Used: text under the title' },
      { name: 'mReportsTitle', label: 'My Reports: title', required: true, help: 'Also the menu name' },
      { name: 'mReportsText', label: 'My Reports: text under the title' },
      { name: 'mProfileTitle', label: 'My Profile: title', required: true },
      { name: 'mProfileText', label: 'My Profile: text under the title' },
    ],
  },
  {
    key: 'notes', label: 'Notifications (🔔 bell)', icon: 'bi-bell',
    fields: [
      { name: 'mNoteNew', label: 'New job given to the mechanic', required: true },
      { name: 'mNoteToday', label: 'Customer’s car comes today', required: true, help: '{time} = the appointment time' },
      { name: 'mNoteLate', label: 'Job past its due date', required: true },
      { name: 'mNoteEmpty', label: 'When there are no notifications', required: true, col: 12 },
    ],
  },
  {
    key: 'menu', label: 'Avatar menu & Today card', icon: 'bi-person-circle',
    fields: [
      { name: 'mMenuProfile', label: 'Avatar menu: profile link', required: true },
      { name: 'mMenuLogout', label: 'Avatar menu: log out', required: true },
      { name: 'mTodayWaiting', label: 'Today card: jobs waiting', required: true, help: '{count} = how many jobs' },
      { name: 'mTodayDone', label: 'Today card: nothing waiting', required: true },
      { name: 'mTodayStart', label: 'Today card: button to start', required: true },
      { name: 'mTodayContinue', label: 'Today card: button to continue', required: true },
    ],
  },
]
