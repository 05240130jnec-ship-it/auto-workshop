// The texts of the mechanic portal, grouped for the admin page "Mechanic Portal".
// Each field = one row in the MySQL table `settings`.
export const MECHANIC_GROUPS = [
  {
    key: 'staff', label: 'Staff login page', icon: 'bi-shield-lock',
    fields: [
      { name: 'staffLoginTitle', label: 'Title', required: true, help: 'The page at /staff-login (mechanics and admin)' },
      { name: 'staffLoginText', label: 'Text under the title', col: 12 },
      { name: 'staffLoginNote', label: 'Note under the Sign in button', col: 12 },
    ],
  },
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
    key: 'job', label: 'Repair job page', icon: 'bi-wrench-adjustable',
    fields: [
      { name: 'mJobVehicle', label: 'Box: vehicle and customer', required: true },
      { name: 'mJobProblem', label: 'Box: problem description', required: true },
      { name: 'mJobNoProblem', label: 'When the customer wrote no problem', required: true },
      { name: 'mJobNotes', label: 'Box: work notes', required: true },
      { name: 'mJobStatus', label: 'Box: update status', required: true },
      { name: 'mJobAddNote', label: 'Note box label', required: true },
      { name: 'mJobSaveNote', label: 'Button: save note', required: true },
      { name: 'mJobParts', label: 'Box: parts used', required: true },
      { name: 'mJobAddPart', label: 'Button: add part', required: true },
      { name: 'mJobNoParts', label: 'When no parts are logged', required: true },
      { name: 'mJobServices', label: 'Box: services', required: true },
      { name: 'mJobAddService', label: 'Button: add service', required: true },
      { name: 'mJobGrand', label: 'Grand total label', required: true },
      { name: 'mJobComplete', label: 'Button: complete repair', required: true },
      { name: 'mJobReady', label: 'Message when the job is completed', required: true, col: 12, help: '{vehicle} = the car' },
    ],
  },
  {
    key: 'boxes', label: 'Dashboard & profile boxes', icon: 'bi-grid-1x2',
    fields: [
      { name: 'mDashJobs', label: 'Dashboard: jobs box', required: true },
      { name: 'mDashParts', label: 'Dashboard: parts box', required: true },
      { name: 'mProfInfo', label: 'My Profile: personal box', required: true },
      { name: 'mProfPro', label: 'My Profile: professional box', required: true },
      { name: 'mProfPassword', label: 'My Profile: password box', required: true },
      { name: 'mProfNameNote', label: 'My Profile: note under the email', required: true, col: 12 },
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
