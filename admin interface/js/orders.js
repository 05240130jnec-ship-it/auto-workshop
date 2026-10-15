// Purchase orders — approve / reject requests, receive deliveries into stock
(function () {
  const { Store, Q, UI, esc, nu, nuShort, fmtDate, relDate, badge } = AC;
  const STATUSES = [['pending', 'Pending'], ['approved', 'Approved'], ['received', 'Received'], ['rejected', 'Rejected']];
  let filter = 'all';
  const getQuery = AC.bindSearch(render);
  AC.bindTabs(document.getElementById('tabs'), f => { filter = f; render(); });

  function renderStats() {
    const os = Store.all('orders');
    const sum = list => list.reduce((s, o) => s + Q.poCost(o), 0);
    const pend = os.filter(o => o.status === 'pending'), appr = os.filter(o => o.status === 'approved');
    const month = AC.today().slice(0, 7);
    const spent = os.filter(o => o.status === 'received' && o.date.slice(0, 7) === month);
    const stat = (icon, tone, label, v, foot, cls) => '<div class="a-stat"><div class="a-stat-icon a-icon-' + tone + '"><i class="bi ' + icon + '"></i></div><div><h6>' + label + '</h6><div class="a-stat-value">' + v + '</div><p class="a-stat-foot ' + (cls || '') + '">' + foot + '</p></div></div>';
    document.getElementById('stats').innerHTML =
      stat('bi-hourglass-split', 'orange', 'Awaiting approval', pend.length, nu(sum(pend)) + ' requested', 'orange') +
      stat('bi-truck', 'blue', 'On the way', appr.length, nu(sum(appr)) + ' approved', 'blue') +
      stat('bi-box-arrow-in-down', 'green', 'Received this month', spent.length, nu(sum(spent)) + ' spent', 'green') +
      stat('bi-receipt', 'purple', 'All orders', os.length, nuShort(sum(os.filter(o => o.status !== 'rejected'))) + ' total value');
  }
  function renderTabs() {
    const os = Store.all('orders');
    const tabs = [['all', 'All', os.length]].concat(STATUSES.map(s => [s[0], s[1], os.filter(o => o.status === s[0]).length]));
    document.getElementById('tabs').innerHTML = tabs.map(t => '<button data-filter="' + t[0] + '"' + (filter === t[0] ? ' class="active"' : '') + '>' + t[1] + '<span class="a-tab-count">' + t[2] + '</span></button>').join('');
  }

  function render() {
    renderStats(); renderTabs();
    const q = getQuery();
    const rows = Store.all('orders')
      .filter(o => filter === 'all' || o.status === filter)
      .filter(o => { const p = Q.part(o.partId) || {}; return !q || [o.id, p.name, p.sku, Q.supplierName(o.supplierId), Q.mechanicName(o.requestedBy)].join(' ').toLowerCase().includes(q); })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    document.getElementById('tableBody').innerHTML = rows.length ? rows.map(o => {
      const p = Q.part(o.partId) || { name: '(deleted part)', sku: '', stock: 0 };
      let actions = '';
      if (o.status === 'pending') actions =
        '<button class="a-btn a-btn-success a-btn-sm" data-approve="' + o.id + '"><i class="bi bi-check-lg"></i> Approve</button>' +
        '<button class="a-btn a-btn-outline a-btn-sm" data-reject="' + o.id + '">Reject</button>';
      else if (o.status === 'approved') actions = '<button class="a-btn a-btn-primary a-btn-sm" data-receive="' + o.id + '"><i class="bi bi-box-arrow-in-down"></i> Mark received</button>';
      else actions = '<button class="a-icon-action" title="View" data-view="' + o.id + '"><i class="bi bi-eye"></i></button>';
      return '<tr>' +
        '<td><span class="a-id">#' + o.id + '</span><small>' + relDate(o.date) + '</small></td>' +
        '<td><strong>' + esc(p.name) + '</strong><small>' + esc(p.sku) + ' · ' + p.stock + ' in stock</small></td>' +
        '<td>' + o.qty + '</td>' +
        '<td>' + esc(Q.supplierName(o.supplierId)) + '</td>' +
        '<td>' + esc(Q.mechanicName(o.requestedBy)) + (o.note ? '<small title="' + esc(o.note) + '"><i class="bi bi-chat-left-text"></i> ' + esc(o.note.length > 28 ? o.note.slice(0, 28) + '…' : o.note) + '</small>' : '') + '</td>' +
        '<td><strong>' + nu(Q.poCost(o)) + '</strong></td>' +
        '<td>' + badge(o.status) + '</td>' +
        '<td><div class="a-actions">' + actions + '</div></td></tr>';
    }).join('') : AC.emptyRow(8, 'No purchase orders here');
    document.getElementById('tableInfo').textContent = 'Showing ' + rows.length + ' of ' + Store.all('orders').length + ' orders';
  }

  function view(id) {
    const o = Store.get('orders', id), p = Q.part(o.partId) || {}, s = Q.supplier(o.supplierId) || {};
    UI.view('Purchase order <span class="a-id">#' + o.id + '</span>',
      '<div class="a-detail-grid">' +
      '<div><span>Part</span><strong>' + esc(p.name || '') + '</strong><br><small class="text-muted">' + esc(p.sku || '') + '</small></div>' +
      '<div><span>Quantity</span><strong>' + o.qty + ' × ' + nu(p.price) + '</strong></div>' +
      '<div><span>Total</span><strong>' + nu(Q.poCost(o)) + '</strong></div>' +
      '<div><span>Status</span>' + badge(o.status) + '</div>' +
      '<div><span>Supplier</span><strong>' + esc(s.name || '') + '</strong><br><small class="text-muted">' + esc(s.phone || '') + '</small></div>' +
      '<div><span>Requested by</span><strong>' + esc(Q.mechanicName(o.requestedBy)) + '</strong></div>' +
      '<div><span>Date</span><strong>' + fmtDate(o.date) + '</strong></div>' +
      '</div>' + (o.note ? '<div class="a-note">' + esc(o.note) + '</div>' : ''));
  }

  async function act(id, status) {
    const o = Store.get('orders', id), p = Q.part(o.partId) || {};
    if (status === 'rejected') {
      const v = await UI.form({ title: 'Reject ' + id, size: 'sm', submitText: 'Reject order', fields: [{ name: 'note', label: 'Reason (shown to the mechanic)', type: 'textarea', col: 12, required: true }] });
      if (!v) return;
      Store.update('orders', id, { status, note: v.note });
      UI.toast(id + ' rejected', 'info');
    } else if (status === 'approved') {
      Store.update('orders', id, { status });
      UI.toast(id + ' approved · ' + nu(Q.poCost(o)) + ' order sent to ' + esc(Q.supplierName(o.supplierId)));
    } else if (status === 'received') {
      const ok = await UI.confirm('Add <b>' + o.qty + ' × ' + esc(p.name) + '</b> to inventory? Stock will go from ' + p.stock + ' to ' + (p.stock + o.qty) + '.', { title: 'Receive delivery', okText: 'Add to stock' });
      if (!ok) return;
      if (p.id) Store.update('inventory', p.id, { stock: p.stock + o.qty });
      Store.update('orders', id, { status, date: AC.today() });
      UI.toast(o.qty + ' × ' + esc(p.name) + ' added to stock');
    }
    render(); AC.refreshChrome();
  }

  async function add() {
    const parts = Store.all('inventory');
    const v = await UI.form({
      title: 'New purchase order', submitText: 'Create order',
      fields: [
        { name: 'partId', label: 'Part', type: 'select', required: true, empty: 'Select part…', col: 12, options: parts.map(p => ({ value: p.id, label: p.name + ' — ' + p.stock + ' in stock (' + nu(p.price) + ')' })) },
        { name: 'qty', label: 'Quantity', type: 'number', min: 1, required: true, help: '<b id="poTotal"></b>' },
        { name: 'requestedBy', label: 'Requested by', type: 'select', options: [{ value: 'admin', label: 'Admin' }].concat(Store.all('mechanics').map(m => ({ value: m.id, label: m.name }))) },
        { name: 'note', label: 'Note', type: 'textarea', col: 12 }
      ],
      onInput: f => { const p = Q.part(f.elements.partId.value); const t = f.querySelector('#poTotal'); if (t) t.textContent = p ? 'Total: ' + nu((Number(f.elements.qty.value) || 0) * p.price) + ' · supplier: ' + Q.supplierName(p.supplierId) : ''; }
    });
    if (!v) return;
    const p = Q.part(v.partId);
    const id = Store.nextId('orders', 'PO-', 4);
    Store.add('orders', { id, partId: v.partId, qty: v.qty, supplierId: p.supplierId, requestedBy: v.requestedBy, status: v.requestedBy === 'admin' ? 'approved' : 'pending', date: AC.today(), note: v.note });
    filter = 'all'; render(); AC.refreshChrome();
    UI.toast('Order <b>' + id + '</b> created');
  }

  document.getElementById('tableBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.approve) act(b.dataset.approve, 'approved');
    if (b.dataset.reject) act(b.dataset.reject, 'rejected');
    if (b.dataset.receive) act(b.dataset.receive, 'received');
    if (b.dataset.view) view(b.dataset.view);
  });
  document.getElementById('addBtn').addEventListener('click', add);
  render();
})();
