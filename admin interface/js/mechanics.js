// Mechanics — team cards with live workload
(function () {
  const { Store, Q, UI, esc, nu, fmtDate, relDate, badge, avatar } = AC;
  const params = new URLSearchParams(location.search);
  const getQuery = AC.bindSearch(render);
  const SPECS = ['Engine & Diagnostics', 'Brake Systems', 'General Repairs', 'Electrical Systems', 'Body & Paint', 'AC & Cooling', 'Tyres & Alignment'];

  function renderStats() {
    const ms = Store.all('mechanics');
    const states = ms.map(Q.mechanicState);
    const active = Store.all('repairs').filter(r => r.status === 'progress').length;
    const stat = (icon, tone, label, value, foot) => '<div class="a-stat"><div class="a-stat-icon a-icon-' + tone + '"><i class="bi ' + icon + '"></i></div><div><h6>' + label + '</h6><div class="a-stat-value">' + value + '</div><p class="a-stat-foot">' + foot + '</p></div></div>';
    document.getElementById('stats').innerHTML =
      stat('bi-people', 'purple', 'Team size', ms.length, 'Mechanics on staff') +
      stat('bi-person-check', 'green', 'Available', states.filter(s => s.key === 'available').length, 'Can take new jobs') +
      stat('bi-hourglass-split', 'orange', 'Busy', states.filter(s => s.key === 'busy').length, '3+ active jobs') +
      stat('bi-gear-wide-connected', 'blue', 'Jobs in progress', active, 'Across the workshop');
  }

  function render() {
    renderStats();
    const q = getQuery();
    const ms = Store.all('mechanics').filter(m => !q || [m.id, m.name, m.specialization, m.phone].join(' ').toLowerCase().includes(q));
    document.getElementById('cards').innerHTML = ms.length ? ms.map(m => {
      const st = Q.mechanicState(m), jobs = Q.activeJobs(m.id), done = Q.completedJobs(m.id);
      const earned = Store.all('repairs').filter(r => r.mechanicId === m.id && r.status === 'complete').reduce((s, r) => s + r.cost, 0);
      return '<div class="a-mcard' + (st.key === 'leave' ? ' off' : '') + '">' +
        '<div class="a-mcard-head">' + avatar(m.name, m.photo) + '<div style="flex:1;min-width:0"><h4>' + esc(m.name) + '</h4><p>' + esc(m.specialization) + '</p><p>' + esc(m.phone) + '</p></div>' + '<span class="a-badge a-badge-' + st.cls + '">' + st.label + '</span>' + '</div>' +
        '<div class="a-mcard-stats"><div><strong>' + jobs + '</strong><small>Active</small></div><div><strong>' + done + '</strong><small>Done</small></div><div><strong>' + m.experience + 'y</strong><small>Exp.</small></div></div>' +
        '<div><div class="d-flex justify-content-between small mb-1"><span class="text-muted">Workload</span><span class="fw-semibold">' + Math.min(jobs * 25, 100) + '%</span></div><div class="a-bar"><span style="width:' + Math.min(jobs * 25, 100) + '%;background:' + (jobs >= 3 ? '#ea580c' : 'var(--a-purple)') + '"></span></div></div>' +
        '<div class="small text-muted">Revenue from completed jobs: <b class="text-dark">' + nu(earned) + '</b></div>' +
        '<div class="a-mcard-foot">' +
        '<button class="a-btn a-btn-outline a-btn-sm" data-jobs="' + m.id + '"><i class="bi bi-list-task"></i> Jobs</button>' +
        '<button class="a-btn a-btn-outline a-btn-sm" data-edit="' + m.id + '"><i class="bi bi-pencil"></i> Edit</button>' +
        '<button class="a-btn a-btn-outline a-btn-sm" data-leave="' + m.id + '">' + (m.status === 'leave' ? '<i class="bi bi-person-check"></i> Back' : '<i class="bi bi-calendar-x"></i> Leave') + '</button>' +
        '<button class="a-icon-action danger" title="Remove" data-del="' + m.id + '"><i class="bi bi-trash3"></i></button>' +
        '</div></div>';
    }).join('') : '<div class="a-panel"><div class="a-empty"><i class="bi bi-search"></i><p>No mechanics match your search.</p></div></div>';
  }

  const fields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+975 17XXXXXX' },
    { name: 'specialization', label: 'Specialization', type: 'select', required: true, options: SPECS },
    { name: 'experience', label: 'Experience (years)', type: 'number', min: 0, max: 50, required: true },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Working' }, { value: 'leave', label: 'On leave' }], default: 'active' },
    { name: 'joined', label: 'Joined on', type: 'date', default: AC.today() }
  ];

  async function add() {
    const v = await UI.form({ title: 'Add mechanic', fields, submitText: 'Add mechanic' });
    if (!v) return;
    v.id = Store.nextId('mechanics', 'M-', 3);
    Store.all('mechanics').push(v); Store.save();
    render(); UI.toast('<b>' + esc(v.name) + '</b> joined the team');
  }
  async function edit(id) {
    const m = Store.get('mechanics', id);
    const v = await UI.form({ title: 'Edit ' + m.name, fields, values: m, submitText: 'Save' });
    if (!v) return;
    if (v.status === 'leave' && m.status !== 'leave' && Q.activeJobs(id)) { UI.toast('Use the Leave button so active jobs get handed back', 'warn'); v.status = 'active'; }
    Store.update('mechanics', id, v);
    render(); UI.toast('Saved');
  }
  async function del(id) {
    const m = Store.get('mechanics', id);
    if (Q.activeJobs(id)) { UI.toast('Reassign ' + esc(m.name) + '\'s ' + Q.activeJobs(id) + ' active job(s) first', 'warn'); return; }
    const ok = await UI.confirm('<b>' + esc(m.name) + '</b> will be removed from the team. Their completed jobs stay in the records.', { title: 'Remove mechanic?', okText: 'Remove', danger: true });
    if (ok) { Store.remove('mechanics', id); render(); UI.toast(esc(m.name) + ' removed', 'info'); }
  }
  async function toggleLeave(id) {
    const m = Store.get('mechanics', id);
    if (m.status !== 'leave' && Q.activeJobs(id)) {
      const ok = await UI.confirm(esc(m.name) + ' still has ' + Q.activeJobs(id) + ' active job(s). Those jobs will go back to <b>Pending</b> so you can reassign them.', { title: 'Put on leave?', okText: 'Put on leave' });
      if (!ok) return;
      Store.all('repairs').forEach(r => { if (r.mechanicId === id && (r.status === 'pending' || r.status === 'progress')) { r.mechanicId = null; r.status = 'pending'; } });
    }
    Store.update('mechanics', id, { status: m.status === 'leave' ? 'active' : 'leave' });
    render(); AC.refreshChrome();
    UI.toast(esc(m.name) + (m.status === 'leave' ? ' is now on leave' : ' is back at work'), 'info');
  }
  function jobs(id) {
    const m = Store.get('mechanics', id);
    const list = Store.all('repairs').filter(r => r.mechanicId === id).sort((a, b) => b.date.localeCompare(a.date));
    UI.view(esc(m.name) + ' — jobs', list.length ? '<table class="a-mini-table"><thead><tr><th>Job</th><th>Date</th><th>Vehicle</th><th>Service</th><th>Status</th><th class="text-end">Amount</th></tr></thead><tbody>' +
      list.map(r => '<tr><td><a class="a-id" href="repairs.html?open=' + r.id + '">#' + r.id + '</a></td><td>' + relDate(r.date) + '</td><td>' + esc(r.vehicle) + '<br><small class="text-muted">' + esc(r.plate) + '</small></td><td>' + esc(r.service) + '</td><td>' + badge(r.status) + '</td><td class="text-end">' + nu(r.cost) + '</td></tr>').join('') + '</tbody></table>'
      : '<div class="a-empty"><i class="bi bi-inbox"></i><p>No jobs assigned yet.</p></div>');
  }

  document.getElementById('cards').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) edit(b.dataset.edit);
    if (b.dataset.leave) toggleLeave(b.dataset.leave);
    if (b.dataset.jobs) jobs(b.dataset.jobs);
    if (b.dataset.del) del(b.dataset.del);
  });
  document.getElementById('addBtn').addEventListener('click', add);
  render();
  if (params.get('new')) add();
})();
