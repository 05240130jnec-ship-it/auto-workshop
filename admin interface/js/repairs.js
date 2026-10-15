// Repairs — create jobs, assign mechanics, move jobs through their status
(function () {
  const { Store, Q, UI, esc, nu, fmtDate, relDate, badge, priorityTag, avatar } = AC;
  const SERVICES = ['Engine Diagnostics', 'Brake Service', 'Oil Change', 'Car Wash & Detailing', 'Wheel Alignment', 'Battery Replacement', 'AC Service', 'General Service', 'Body & Paint'];
  const STATUSES = [['pending', 'Pending'], ['progress', 'In Progress'], ['complete', 'Complete'], ['cancelled', 'Cancelled']];
  const params = new URLSearchParams(location.search);
  let filter = 'all';
  const search = document.querySelector('.a-search');
  if (params.get('q')) search.value = params.get('q');
  const getQuery = AC.bindSearch(render);

  function renderTabs() {
    const all = Store.all('repairs');
    const tabs = [['all', 'All', all.length]].concat(STATUSES.map(s => [s[0], s[1], all.filter(r => r.status === s[0]).length]));
    document.getElementById('tabs').innerHTML = tabs.map(t => '<button data-filter="' + t[0] + '"' + (filter === t[0] ? ' class="active"' : '') + '>' + t[1] + '<span class="a-tab-count">' + t[2] + '</span></button>').join('');
  }
  AC.bindTabs(document.getElementById('tabs'), f => { filter = f; render(); });

  function mechanicSelect(r) {
    if (r.status === 'complete' || r.status === 'cancelled') {
      return r.mechanicId ? '<div class="a-person">' + avatar(Q.mechanicName(r.mechanicId), (Q.mechanic(r.mechanicId) || {}).photo) + '<span>' + esc(Q.mechanicName(r.mechanicId)) + '</span></div>' : '<span class="text-muted">—</span>';
    }
    const opts = Store.all('mechanics').map(m => {
      const st = Q.mechanicState(m);
      return '<option value="' + m.id + '"' + (m.id === r.mechanicId ? ' selected' : '') + (st.key === 'leave' ? ' disabled' : '') + '>' + esc(m.name) + ' (' + (st.key === 'leave' ? 'on leave' : Q.activeJobs(m.id) + ' jobs') + ')</option>';
    }).join('');
    return '<select class="a-select-sm' + (r.mechanicId ? '' : ' unassigned') + '" data-assign="' + r.id + '"><option value="">— Assign —</option>' + opts + '</select>';
  }

  function render() {
    renderTabs();
    const q = getQuery();
    const rows = Store.all('repairs')
      .filter(r => filter === 'all' || r.status === filter)
      .filter(r => !q || [r.id, r.vehicle, r.plate, r.service, Q.customerName(r.customerId), Q.mechanicName(r.mechanicId)].join(' ').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    document.getElementById('tableBody').innerHTML = rows.length ? rows.map(r => {
      const c = Q.customer(r.customerId) || {};
      const overdue = (r.status === 'pending' || r.status === 'progress') && r.due && r.due < AC.today();
      return '<tr>' +
        '<td><span class="a-id">#' + r.id + '</span><small>' + relDate(r.date) + '</small></td>' +
        '<td><strong>' + esc(r.vehicle) + '</strong><small>' + esc(r.plate) + '</small></td>' +
        '<td>' + esc(c.name || 'Unknown') + '<small>' + esc(c.phone || '') + '</small></td>' +
        '<td>' + esc(r.service) + priorityTag(r.priority) + ((r.status === 'pending' || r.status === 'progress') ? '<small' + (overdue ? ' style="color:var(--a-red);font-weight:600"' : '') + '>Due ' + relDate(r.due).toLowerCase() + (overdue ? ' · overdue' : '') + '</small>' : '') + '</td>' +
        '<td>' + mechanicSelect(r) + '</td>' +
        '<td>' + badge(r.status) + '</td>' +
        '<td>' + (r.cost ? nu(r.cost) : '—') + '</td>' +
        '<td><div class="a-actions">' +
        (r.status === 'progress' ? '<button class="a-icon-action success" title="Mark complete" data-complete="' + r.id + '"><i class="bi bi-check2-circle"></i></button>' : '') +
        '<button class="a-icon-action" title="View details" data-view="' + r.id + '"><i class="bi bi-eye"></i></button>' +
        '<button class="a-icon-action" title="Edit" data-edit="' + r.id + '"><i class="bi bi-pencil"></i></button>' +
        '<button class="a-icon-action danger" title="Delete" data-del="' + r.id + '"><i class="bi bi-trash3"></i></button>' +
        '</div></td></tr>';
    }).join('') : AC.emptyRow(8, q ? 'No jobs match "' + esc(q) + '"' : 'No jobs in this list');
    document.getElementById('tableInfo').textContent = 'Showing ' + rows.length + ' of ' + Store.all('repairs').length + ' jobs';
  }

  function setStatus(id, status) {
    const r = Store.get('repairs', id);
    if (status === 'progress' && !r.mechanicId) { UI.toast('Assign a mechanic before starting the job', 'warn'); return false; }
    Store.update('repairs', id, { status });
    UI.toast('#' + id + ' marked as <b>' + STATUSES.find(s => s[0] === status)[1] + '</b>');
    render(); AC.refreshChrome();
    return true;
  }

  function formFields() {
    return [
      { name: 'customerId', label: 'Customer', type: 'select', required: true, empty: 'Select customer…', options: Store.all('customers').map(c => ({ value: c.id, label: c.name + ' — ' + c.phone })) },
      { name: 'service', label: 'Service', type: 'select', required: true, empty: 'Select service…', options: SERVICES },
      { name: 'vehicle', label: 'Vehicle (make & model)', required: true, placeholder: 'e.g. Toyota Corolla' },
      { name: 'plate', label: 'Plate number', required: true, placeholder: 'e.g. BP-1-A1234', help: 'Format: BP-1-A1234' },
      { name: 'mechanicId', label: 'Assign mechanic', type: 'select', empty: 'Assign later', options: Store.all('mechanics').filter(m => m.status !== 'leave').map(m => ({ value: m.id, label: m.name + ' — ' + m.specialization + ' (' + Q.activeJobs(m.id) + ' jobs)' })) },
      { name: 'priority', label: 'Priority', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }], default: 'normal' },
      { name: 'date', label: 'Booked on', type: 'date', required: true, default: AC.today() },
      { name: 'due', label: 'Promised by', type: 'date', required: true, default: AC.daysAgo(-1) },
      { name: 'cost', label: 'Estimated cost (Nu.)', type: 'number', min: 0, step: 50, required: true },
      { name: 'status', label: 'Status', type: 'select', options: STATUSES.map(s => ({ value: s[0], label: s[1] })), default: 'pending' },
      { name: 'notes', label: 'Customer complaint / notes', type: 'textarea', col: 12, placeholder: 'What did the customer report?' }
    ];
  }
  const validate = v => {
    if (v.due < v.date) return 'The promised date can\'t be before the booking date';
    if (v.status === 'progress' && !v.mechanicId) return 'Assign a mechanic to mark the job In Progress';
    return null;
  };

  async function addJob() {
    const v = await UI.form({ title: 'New repair job', fields: formFields(), submitText: 'Create job', validate });
    if (!v) return;
    v.mechanicId = v.mechanicId || null;
    v.plate = v.plate.toUpperCase();
    if (v.mechanicId && v.status === 'pending') v.status = 'progress';
    v.id = Store.nextId('repairs', 'ACP-', 4);
    Store.add('repairs', v);
    filter = 'all'; render(); AC.refreshChrome();
    UI.toast('Job <b>#' + v.id + '</b> created for ' + esc(Q.customerName(v.customerId)));
  }

  async function editJob(id) {
    const r = Store.get('repairs', id);
    const v = await UI.form({ title: 'Edit job #' + id, fields: formFields(), values: r, submitText: 'Save changes', validate });
    if (!v) return;
    v.mechanicId = v.mechanicId || null;
    v.plate = v.plate.toUpperCase();
    Store.update('repairs', id, v);
    render(); AC.refreshChrome();
    UI.toast('Job #' + id + ' updated');
  }

  function viewJob(id) {
    const r = Store.get('repairs', id);
    if (!r) return;
    const c = Q.customer(r.customerId) || {};
    const m = Q.mechanic(r.mechanicId);
    const order = ['pending', 'progress', 'complete'];
    const idx = r.status === 'cancelled' ? -1 : order.indexOf(r.status);
    const steps = r.status === 'cancelled' ? '<div class="a-note mb-3" style="border-color:#fca5a5;color:#b91c1c"><i class="bi bi-x-circle"></i> This job was cancelled.</div>' :
      '<div class="a-steps">' + ['Booked', 'In progress', 'Complete'].map((s, i) => '<div class="' + (i <= idx ? 'done' : '') + '">' + s + '</div>').join('') + '</div>';
    const history = Store.all('repairs').filter(x => x.plate === r.plate && x.id !== r.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const body = steps +
      '<div class="a-detail-grid">' +
      '<div><span>Vehicle</span><strong>' + esc(r.vehicle) + '</strong><br><small class="text-muted">' + esc(r.plate) + '</small></div>' +
      '<div><span>Customer</span><strong>' + esc(c.name || '') + '</strong><br><small class="text-muted">' + esc(c.phone || '') + '</small></div>' +
      '<div><span>Service</span><strong>' + esc(r.service) + '</strong>' + priorityTag(r.priority) + '</div>' +
      '<div><span>Mechanic</span><strong>' + (m ? esc(m.name) : '<span class="text-warning">Not assigned</span>') + '</strong></div>' +
      '<div><span>Booked</span><strong>' + fmtDate(r.date) + '</strong></div>' +
      '<div><span>Promised by</span><strong>' + fmtDate(r.due) + '</strong></div>' +
      '<div><span>Status</span>' + badge(r.status) + '</div>' +
      '<div><span>' + (r.status === 'complete' ? 'Amount charged' : 'Estimate') + '</span><strong>' + nu(r.cost) + '</strong></div>' +
      '</div>' +
      (r.notes ? '<div class="a-section-title">Notes</div><div class="a-note mb-3">' + esc(r.notes) + '</div>' : '') +
      '<div class="a-section-title">Previous visits for ' + esc(r.plate) + '</div>' +
      (history.length ? '<table class="a-mini-table"><thead><tr><th>Job</th><th>Date</th><th>Service</th><th>Status</th><th class="text-end">Cost</th></tr></thead><tbody>' +
        history.map(h => '<tr><td class="a-id">#' + h.id + '</td><td>' + fmtDate(h.date) + '</td><td>' + esc(h.service) + '</td><td>' + badge(h.status) + '</td><td class="text-end">' + nu(h.cost) + '</td></tr>').join('') + '</tbody></table>'
        : '<p class="text-muted small mb-0">First visit for this vehicle.</p>');
    let foot = '';
    if (r.status === 'pending') foot = '<button class="a-btn a-btn-outline" data-act="cancelled">Cancel job</button><button class="a-btn a-btn-primary" data-act="progress"><i class="bi bi-play-fill"></i> Start job</button>';
    if (r.status === 'progress') foot = '<button class="a-btn a-btn-success" data-act="complete"><i class="bi bi-check2-circle"></i> Mark complete</button>';
    UI.view('Job <span class="a-id">#' + r.id + '</span>', body, foot, el => {
      el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { if (setStatus(r.id, b.dataset.act)) UI.hideView(); });
    });
  }

  async function completeJob(id) {
    const r = Store.get('repairs', id);
    const v = await UI.form({
      title: 'Complete job #' + id, size: 'sm', submitText: 'Mark complete',
      fields: [{ name: 'cost', label: 'Final amount charged (Nu.)', type: 'number', min: 0, step: 50, required: true, col: 12, help: 'Estimate was ' + nu(r.cost) }]
      , values: { cost: r.cost }
    });
    if (!v) return;
    Store.update('repairs', id, { cost: v.cost, status: 'complete' });
    render(); AC.refreshChrome();
    UI.toast('#' + id + ' completed · ' + nu(v.cost) + ' charged');
  }

  document.getElementById('tableBody').addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) viewJob(b.dataset.view);
    if (b.dataset.edit) editJob(b.dataset.edit);
    if (b.dataset.complete) completeJob(b.dataset.complete);
    if (b.dataset.del) {
      const ok = await UI.confirm('Job <b>#' + b.dataset.del + '</b> will be permanently removed.', { title: 'Delete this job?', okText: 'Delete', danger: true });
      if (ok) { Store.remove('repairs', b.dataset.del); render(); AC.refreshChrome(); UI.toast('Job #' + b.dataset.del + ' deleted', 'info'); }
    }
  });

  document.getElementById('tableBody').addEventListener('change', e => {
    const s = e.target.closest('select[data-assign]');
    if (!s) return;
    const id = s.dataset.assign, r = Store.get('repairs', id);
    if (!s.value) { Store.update('repairs', id, { mechanicId: null, status: 'pending' }); UI.toast('#' + id + ' unassigned', 'info'); }
    else {
      const patch = { mechanicId: s.value };
      if (r.status === 'pending') patch.status = 'progress';
      Store.update('repairs', id, patch);
      UI.toast('#' + id + ' assigned to <b>' + esc(Q.mechanicName(s.value)) + '</b>' + (patch.status ? ' · now In Progress' : ''));
    }
    render(); AC.refreshChrome();
  });

  document.getElementById('addBtn').addEventListener('click', addJob);
  render();
  if (params.get('new')) addJob();
  if (params.get('open')) viewJob(params.get('open'));
})();
