// Suppliers — contact book linked to inventory and purchase orders
(function () {
  const { Store, Q, UI, esc, nu, relDate, badge } = AC;
  const params = new URLSearchParams(location.search);
  const getQuery = AC.bindSearch(render);
  const partsOf = id => Store.all('inventory').filter(p => p.supplierId === id);
  const ordersOf = id => Store.all('orders').filter(o => o.supplierId === id);

  function render() {
    const q = getQuery();
    const rows = Store.all('suppliers').filter(s => !q || [s.name, s.person, s.phone, s.email, s.address].join(' ').toLowerCase().includes(q));
    document.getElementById('tableBody').innerHTML = rows.length ? rows.map(s => {
      const parts = partsOf(s.id), orders = ordersOf(s.id);
      const spent = orders.filter(o => o.status === 'received').reduce((t, o) => t + Q.poCost(o), 0);
      return '<tr>' +
        '<td><strong>' + esc(s.name) + '</strong><small>' + esc(s.person || '') + '</small></td>' +
        '<td><a href="tel:' + esc((s.phone || '').replace(/\s/g, '')) + '">' + esc(s.phone) + '</a><small>' + esc(s.email || '') + '</small></td>' +
        '<td>' + esc(s.address) + '</td>' +
        '<td>' + parts.length + ' product' + (parts.length === 1 ? '' : 's') + '<small>' + esc(parts.slice(0, 2).map(p => p.name).join(', ')) + (parts.length > 2 ? '…' : '') + '</small></td>' +
        '<td>' + orders.length + '<small>' + nu(spent) + ' received</small></td>' +
        '<td><div class="a-actions">' +
        '<button class="a-icon-action" title="View" data-view="' + s.id + '"><i class="bi bi-eye"></i></button>' +
        '<button class="a-icon-action" title="Edit" data-edit="' + s.id + '"><i class="bi bi-pencil"></i></button>' +
        '<button class="a-icon-action danger" title="Delete" data-del="' + s.id + '"><i class="bi bi-trash3"></i></button>' +
        '</div></td></tr>';
    }).join('') : AC.emptyRow(6, q ? 'No suppliers match "' + esc(q) + '"' : 'No suppliers yet');
    document.getElementById('tableInfo').textContent = rows.length + ' supplier' + (rows.length === 1 ? '' : 's');
  }

  const fields = [
    { name: 'name', label: 'Company name', required: true },
    { name: 'person', label: 'Contact person', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+975 17XXXXXX' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address', required: true, col: 12, placeholder: 'e.g. Norzin Lam, Thimphu' }
  ];
  async function add() {
    const v = await UI.form({ title: 'Add supplier', fields, submitText: 'Add supplier' });
    if (!v) return;
    v.id = Store.nextId('suppliers', 'S-', 2);
    Store.add('suppliers', v);
    render(); UI.toast('<b>' + esc(v.name) + '</b> added');
  }
  async function edit(id) {
    const v = await UI.form({ title: 'Edit supplier', fields, values: Store.get('suppliers', id), submitText: 'Save changes' });
    if (!v) return;
    Store.update('suppliers', id, v);
    render(); UI.toast('Supplier updated');
  }
  function view(id) {
    const s = Store.get('suppliers', id), parts = partsOf(id), orders = ordersOf(id).sort((a, b) => b.date.localeCompare(a.date));
    UI.view(esc(s.name),
      '<div class="a-detail-grid"><div><span>Contact</span><strong>' + esc(s.person) + '</strong></div><div><span>Phone</span><strong>' + esc(s.phone) + '</strong></div><div><span>Email</span><strong>' + esc(s.email || '—') + '</strong></div><div><span>Address</span><strong>' + esc(s.address) + '</strong></div></div>' +
      '<div class="a-section-title">Products supplied (' + parts.length + ')</div>' +
      (parts.length ? '<table class="a-mini-table mb-3"><thead><tr><th>Part</th><th>SKU</th><th>Stock</th><th class="text-end">Price</th></tr></thead><tbody>' + parts.map(p => { const st = Q.stockState(p); return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.sku) + '</td><td><span class="a-badge a-badge-' + st.cls + '">' + p.stock + '</span></td><td class="text-end">' + nu(p.price) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="text-muted small">No products linked.</p>') +
      '<div class="a-section-title">Order history (' + orders.length + ')</div>' +
      (orders.length ? '<table class="a-mini-table"><thead><tr><th>PO</th><th>Date</th><th>Part</th><th>Qty</th><th>Status</th><th class="text-end">Cost</th></tr></thead><tbody>' + orders.map(o => '<tr><td class="a-id">#' + o.id + '</td><td>' + relDate(o.date) + '</td><td>' + esc((Q.part(o.partId) || {}).name || '') + '</td><td>' + o.qty + '</td><td>' + badge(o.status) + '</td><td class="text-end">' + nu(Q.poCost(o)) + '</td></tr>').join('') + '</tbody></table>' : '<p class="text-muted small mb-0">No orders yet.</p>'));
  }
  async function del(id) {
    const s = Store.get('suppliers', id), parts = partsOf(id);
    if (parts.length) { UI.toast(esc(s.name) + ' still supplies ' + parts.length + ' product(s). Move them to another supplier first.', 'warn'); return; }
    const ok = await UI.confirm('<b>' + esc(s.name) + '</b> will be removed.', { title: 'Delete supplier?', okText: 'Delete', danger: true });
    if (ok) { Store.remove('suppliers', id); render(); UI.toast(esc(s.name) + ' deleted', 'info'); }
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
