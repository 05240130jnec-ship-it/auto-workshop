// Inventory — stock levels, quick adjust, reorder → purchase order
(function () {
  const { Store, Q, UI, esc, nu, nuShort } = AC;
  const params = new URLSearchParams(location.search);
  const CATS = ['Auto Parts', 'Cleaning', 'Safety', 'Accessories'];
  let filter = 'all';
  const getQuery = AC.bindSearch(render);
  AC.bindTabs(document.getElementById('tabs'), f => { filter = f; render(); });

  function renderStats() {
    const items = Store.all('inventory');
    const units = items.reduce((s, p) => s + p.stock, 0);
    const value = items.reduce((s, p) => s + p.stock * p.price, 0);
    const low = items.filter(p => p.stock > 0 && p.stock <= p.reorder).length;
    const out = items.filter(p => p.stock <= 0).length;
    const stat = (icon, tone, label, v, foot, cls) => '<div class="a-stat"><div class="a-stat-icon a-icon-' + tone + '"><i class="bi ' + icon + '"></i></div><div><h6>' + label + '</h6><div class="a-stat-value">' + v + '</div><p class="a-stat-foot ' + (cls || '') + '">' + foot + '</p></div></div>';
    document.getElementById('stats').innerHTML =
      stat('bi-box-seam', 'purple', 'Products', items.length, units + ' units in stock') +
      stat('bi-exclamation-triangle', 'orange', 'Low stock', low, 'At or below reorder level', 'orange') +
      stat('bi-x-octagon', 'red', 'Out of stock', out, out ? 'Order now' : 'None', out ? 'red' : '') +
      stat('bi-cash-stack', 'green', 'Stock value', nuShort(value), 'At unit price', 'green');
  }
  function renderTabs() {
    const items = Store.all('inventory');
    const tabs = [['all', 'All', items.length]].concat(CATS.map(c => [c, c, items.filter(p => p.category === c).length]), [['low', '⚠ Needs reorder', Q.lowStock().length]]);
    document.getElementById('tabs').innerHTML = tabs.map(t => '<button data-filter="' + t[0] + '"' + (filter === t[0] ? ' class="active"' : '') + '>' + t[1] + '<span class="a-tab-count">' + t[2] + '</span></button>').join('');
  }

  function render() {
    renderStats(); renderTabs();
    const q = getQuery();
    const pendingFor = id => Store.all('orders').filter(o => o.partId === id && (o.status === 'pending' || o.status === 'approved')).reduce((s, o) => s + o.qty, 0);
    const rows = Store.all('inventory')
      .filter(p => filter === 'all' || (filter === 'low' ? p.stock <= p.reorder : p.category === filter))
      .filter(p => !q || [p.name, p.sku, p.category, Q.supplierName(p.supplierId)].join(' ').toLowerCase().includes(q));
    document.getElementById('tableBody').innerHTML = rows.length ? rows.map(p => {
      const st = Q.stockState(p), incoming = pendingFor(p.id);
      return '<tr>' +
        '<td><strong>' + esc(p.name) + '</strong><small>' + esc(p.sku) + '</small></td>' +
        '<td>' + esc(p.category) + '</td>' +
        '<td><div class="a-stepper"><button data-dec="' + p.id + '" title="Use 1">−</button><span class="a-stock ' + st.key + '">' + p.stock + '</span><button data-inc="' + p.id + '" title="Add 1">+</button></div>' +
        (incoming ? '<small style="color:var(--a-blue)">+' + incoming + ' on order</small>' : '') + '</td>' +
        '<td>' + p.reorder + '</td>' +
        '<td>' + nu(p.price) + '</td>' +
        '<td>' + nu(p.stock * p.price) + '</td>' +
        '<td>' + esc(Q.supplierName(p.supplierId)) + '</td>' +
        '<td><span class="a-badge a-badge-' + st.cls + '">' + st.label + '</span></td>' +
        '<td><div class="a-actions">' +
        '<button class="a-icon-action" title="Reorder" data-reorder="' + p.id + '"><i class="bi bi-cart-plus"></i></button>' +
        '<button class="a-icon-action" title="Edit" data-edit="' + p.id + '"><i class="bi bi-pencil"></i></button>' +
        '<button class="a-icon-action danger" title="Delete" data-del="' + p.id + '"><i class="bi bi-trash3"></i></button>' +
        '</div></td></tr>';
    }).join('') : AC.emptyRow(9, q ? 'No parts match "' + esc(q) + '"' : 'No parts in this category');
    document.getElementById('tableInfo').textContent = 'Showing ' + rows.length + ' of ' + Store.all('inventory').length + ' products';
  }

  const fields = () => [
    { name: 'name', label: 'Part name', required: true, col: 8 },
    { name: 'sku', label: 'SKU / code', required: true, col: 4, placeholder: 'e.g. BRK-FR-01' },
    { name: 'category', label: 'Category', type: 'select', options: CATS, required: true },
    { name: 'supplierId', label: 'Supplier', type: 'select', required: true, empty: 'Select supplier…', options: Store.all('suppliers').map(s => ({ value: s.id, label: s.name })) },
    { name: 'stock', label: 'Quantity in stock', type: 'number', min: 0, required: true, col: 4 },
    { name: 'reorder', label: 'Reorder level', type: 'number', min: 0, required: true, col: 4, help: 'Alert when stock falls to this' },
    { name: 'price', label: 'Unit price (Nu.)', type: 'number', min: 0, step: 10, required: true, col: 4 }
  ];
  const skuCheck = id => v => Store.all('inventory').some(p => p.id !== id && p.sku.toLowerCase() === v.sku.toLowerCase()) ? 'Another part already uses SKU ' + v.sku : null;

  async function add() {
    const v = await UI.form({ title: 'Add part', fields: fields(), submitText: 'Add part', validate: skuCheck() });
    if (!v) return;
    v.sku = v.sku.toUpperCase();
    v.id = Store.nextId('inventory', 'P-', 3);
    Store.add('inventory', v);
    render(); AC.refreshChrome(); UI.toast('<b>' + esc(v.name) + '</b> added to inventory');
  }
  async function edit(id) {
    const v = await UI.form({ title: 'Edit part', fields: fields(), values: Store.get('inventory', id), submitText: 'Save changes', validate: skuCheck(id) });
    if (!v) return;
    v.sku = v.sku.toUpperCase();
    Store.update('inventory', id, v);
    render(); AC.refreshChrome(); UI.toast('Part updated');
  }
  async function reorder(id) {
    const p = Store.get('inventory', id);
    const suggested = Math.max(p.reorder * 2 - p.stock, p.reorder, 1);
    const v = await UI.form({
      title: 'Reorder ' + p.name, size: 'sm', submitText: 'Create purchase order',
      fields: [
        { name: 'qty', label: 'Quantity', type: 'number', min: 1, required: true, col: 12, help: 'Unit price ' + nu(p.price) + ' · supplier ' + esc(Q.supplierName(p.supplierId)) + '<br><b id="poTotal"></b>' },
        { name: 'note', label: 'Note (optional)', type: 'textarea', col: 12 }
      ],
      values: { qty: suggested },
      onInput: f => { const t = f.querySelector('#poTotal'); if (t) t.textContent = 'Total: ' + nu((Number(f.elements.qty.value) || 0) * p.price); }
    });
    if (!v) return;
    const id2 = Store.nextId('orders', 'PO-', 4);
    Store.add('orders', { id: id2, partId: p.id, qty: v.qty, supplierId: p.supplierId, requestedBy: 'admin', status: 'approved', date: AC.today(), note: v.note });
    render(); AC.refreshChrome();
    UI.toast('Purchase order <b>' + id2 + '</b> sent to ' + esc(Q.supplierName(p.supplierId)));
  }
  async function del(id) {
    const p = Store.get('inventory', id);
    const ok = await UI.confirm('<b>' + esc(p.name) + '</b> (' + esc(p.sku) + ') will be removed from inventory.', { title: 'Delete part?', okText: 'Delete', danger: true });
    if (ok) { Store.remove('inventory', id); render(); AC.refreshChrome(); UI.toast(esc(p.name) + ' deleted', 'info'); }
  }
  function adjust(id, d) {
    const p = Store.get('inventory', id);
    if (p.stock + d < 0) return;
    Store.update('inventory', id, { stock: p.stock + d });
    render(); AC.refreshChrome();
    const after = Store.get('inventory', id);
    if (d < 0 && after.stock === after.reorder) UI.toast(esc(p.name) + ' reached its reorder level', 'warn');
    if (d < 0 && after.stock === 0) UI.toast(esc(p.name) + ' is now out of stock', 'error');
  }

  document.getElementById('tableBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.inc) adjust(b.dataset.inc, 1);
    if (b.dataset.dec) adjust(b.dataset.dec, -1);
    if (b.dataset.edit) edit(b.dataset.edit);
    if (b.dataset.reorder) reorder(b.dataset.reorder);
    if (b.dataset.del) del(b.dataset.del);
  });
  document.getElementById('addBtn').addEventListener('click', add);
  render();
  if (params.get('new')) add();
})();
