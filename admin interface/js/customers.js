// Customers — add, edit, view history, deactivate/delete
(function () {
  const { Store, Q, UI, esc, nu, fmtDate, relDate, badge, avatar } = AC;
  const params = new URLSearchParams(location.search);
  let filter = 'all';
  const getQuery = AC.bindSearch(render);
  AC.bindTabs(document.getElementById('tabs'), f => { filter = f; render(); });

  const jobsOf = id => Store.all('repairs').filter(r => r.customerId === id);
  const spentOf = id => jobsOf(id).filter(r => r.status === 'complete').reduce((s, r) => s + r.cost, 0);
  const vehiclesOf = id => { const m = {}; jobsOf(id).forEach(r => { m[r.plate] = r.vehicle; }); return Object.keys(m).map(p => ({ plate: p, vehicle: m[p] })); };

  function render() {
    const q = getQuery();
    const rows = Store.all('customers')
      .filter(c => filter === 'all' || c.status === filter)
      .filter(c => !q || [c.id, c.name, c.phone, c.email, c.address].join(' ').toLowerCase().includes(q));
    document.getElementById('tableBody').innerHTML = rows.length ? rows.map(c => {
      const jobs = jobsOf(c.id), veh = vehiclesOf(c.id), open = jobs.filter(r => r.status === 'pending' || r.status === 'progress').length;
      return '<tr>' +
        '<td><span class="a-id">#' + c.id + '</span></td>' +
        '<td><div class="a-person">' + avatar(c.name) + '<div><strong>' + esc(c.name) + '</strong><small>Since ' + fmtDate(c.joined) + '</small></div></div></td>' +
        '<td>' + esc(c.phone) + '<small>' + esc(c.email) + '</small></td>' +
        '<td>' + veh.length + (veh.length ? '<small>' + veh.slice(0, 2).map(v => esc(v.plate)).join(', ') + (veh.length > 2 ? '…' : '') + '</small>' : '') + '</td>' +
        '<td>' + jobs.length + (open ? '<small style="color:var(--a-blue)">' + open + ' open</small>' : '') + '</td>' +
        '<td><strong>' + nu(spentOf(c.id)) + '</strong></td>' +
        '<td>' + badge(c.status) + '</td>' +
        '<td><div class="a-actions">' +
        '<button class="a-icon-action" title="View" data-view="' + c.id + '"><i class="bi bi-eye"></i></button>' +
        '<button class="a-icon-action" title="Edit" data-edit="' + c.id + '"><i class="bi bi-pencil"></i></button>' +
        '<button class="a-icon-action danger" title="Delete" data-del="' + c.id + '"><i class="bi bi-trash3"></i></button>' +
        '</div></td></tr>';
    }).join('') : AC.emptyRow(8, q ? 'No customers match "' + esc(q) + '"' : 'No customers yet');
    document.getElementById('tableInfo').textContent = 'Showing ' + rows.length + ' of ' + Store.all('customers').length + ' customers';
  }

  const fields = [
    { name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Karma Dorji' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+975 17XXXXXX', pattern: '^\\+?[0-9 ]{8,15}$', help: '8-digit Bhutan mobile, with or without +975' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com' },
    { name: 'address', label: 'Address', placeholder: 'e.g. Motithang, Thimphu' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }], default: 'active' }
  ];
  const normPhone = p => { const d = p.replace(/\D/g, ''); return d.length === 8 ? '+975 ' + d : (d.startsWith('975') ? '+975 ' + d.slice(3) : p); };
  const dupCheck = (v, id) => Store.all('customers').some(c => c.id !== id && c.phone.replace(/\D/g, '').endsWith(v.phone.replace(/\D/g, '').slice(-8))) ? 'A customer with this phone number already exists' : null;

  async function add() {
    const v = await UI.form({ title: 'Add customer', fields, submitText: 'Add customer', validate: v => dupCheck(v) });
    if (!v) return;
    v.phone = normPhone(v.phone);
    v.id = Store.nextId('customers', 'C-', 3);
    v.joined = AC.today();
    Store.add('customers', v);
    render(); UI.toast('<b>' + esc(v.name) + '</b> added as a customer');
  }
  async function edit(id) {
    const v = await UI.form({ title: 'Edit customer', fields, values: Store.get('customers', id), submitText: 'Save changes', validate: v => dupCheck(v, id) });
    if (!v) return;
    v.phone = normPhone(v.phone);
    Store.update('customers', id, v);
    render(); UI.toast('Customer details saved');
  }
  function view(id) {
    const c = Store.get('customers', id);
    const jobs = jobsOf(id).sort((a, b) => b.date.localeCompare(a.date));
    const veh = vehiclesOf(id);
    const body =
      '<div class="d-flex align-items-center gap-3 mb-4">' + avatar(c.name, null, 56) + '<div><h5 class="a-modal-title">' + esc(c.name) + '</h5><small class="text-muted">Customer #' + c.id + ' · since ' + fmtDate(c.joined) + '</small></div><div class="ms-auto">' + badge(c.status) + '</div></div>' +
      '<div class="a-detail-grid">' +
      '<div><span>Phone</span><strong><a href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">' + esc(c.phone) + '</a></strong></div>' +
      '<div><span>Email</span><strong>' + (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '—') + '</strong></div>' +
      '<div><span>Address</span><strong>' + esc(c.address || '—') + '</strong></div>' +
      '<div><span>Total spent</span><strong>' + nu(spentOf(id)) + '</strong></div>' +
      '</div>' +
      '<div class="a-section-title">Vehicles</div>' +
      (veh.length ? '<div class="d-flex flex-wrap gap-2 mb-3">' + veh.map(v => '<span class="a-badge a-badge-muted" style="text-transform:none;font-size:.8rem"><i class="bi bi-car-front"></i> ' + esc(v.vehicle) + ' · ' + esc(v.plate) + '</span>').join('') + '</div>' : '<p class="text-muted small">No vehicles on record yet.</p>') +
      '<div class="a-section-title">Service history (' + jobs.length + ')</div>' +
      (jobs.length ? '<table class="a-mini-table"><thead><tr><th>Job</th><th>Date</th><th>Vehicle</th><th>Service</th><th>Status</th><th class="text-end">Amount</th></tr></thead><tbody>' +
        jobs.map(r => '<tr><td><a class="a-id" href="repairs.html?open=' + r.id + '">#' + r.id + '</a></td><td>' + relDate(r.date) + '</td><td>' + esc(r.vehicle) + '</td><td>' + esc(r.service) + '</td><td>' + badge(r.status) + '</td><td class="text-end">' + nu(r.cost) + '</td></tr>').join('') + '</tbody></table>'
        : '<p class="text-muted small mb-0">No repairs yet.</p>');
    UI.view('Customer details', body, '<a class="a-btn a-btn-primary" href="repairs.html?new=1"><i class="bi bi-plus-lg"></i> New job</a>');
  }
  async function del(id) {
    const c = Store.get('customers', id);
    const open = jobsOf(id).filter(r => r.status === 'pending' || r.status === 'progress').length;
    if (open) { UI.toast(esc(c.name) + ' has ' + open + ' open job(s). Finish or cancel them first.', 'warn'); return; }
    const hasHistory = jobsOf(id).length;
    if (hasHistory) {
      const ok = await UI.confirm(esc(c.name) + ' has ' + hasHistory + ' past job(s). To keep service records, they will be marked <b>inactive</b> instead of deleted.', { title: 'Deactivate customer?', okText: 'Deactivate' });
      if (ok) { Store.update('customers', id, { status: 'inactive' }); render(); UI.toast(esc(c.name) + ' marked inactive', 'info'); }
      return;
    }
    const ok = await UI.confirm('<b>' + esc(c.name) + '</b> will be permanently removed.', { title: 'Delete customer?', okText: 'Delete', danger: true });
    if (ok) { Store.remove('customers', id); render(); UI.toast(esc(c.name) + ' deleted', 'info'); }
  }

  document.getElementById('tableBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.view) view(b.dataset.view);
    if (b.dataset.edit) edit(b.dataset.edit);
    if (b.dataset.del) del(b.dataset.del);
  });
  document.getElementById('addBtn').addEventListener('click', add);
  render();
  if (params.get('new')) add();
})();
