// AutoCare Pro — Admin core (data store, layout, helpers)
// Every admin page loads: bootstrap → data.js → admin.js → <page>.js
(function () {
  const DATA_KEY = 'acp_admin_data_v1';
  const SESSION_KEY = 'acp_admin_session';
  const DAY = 86400000;

  /* ---------- Small helpers ---------- */
  function daysAgo(n) {
    const d = new Date(Date.now() - n * DAY);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function today() { return daysAgo(0); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function nu(n) { return 'Nu. ' + Number(n || 0).toLocaleString('en-IN'); }
  function nuShort(n) {
    n = Number(n || 0);
    if (n >= 100000) return 'Nu. ' + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    if (n >= 1000) return 'Nu. ' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return 'Nu. ' + n;
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function relDate(iso) {
    const diff = Math.round((new Date(today() + 'T00:00:00') - new Date(iso + 'T00:00:00')) / DAY);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 1 && diff < 7) return diff + ' days ago';
    if (diff === -1) return 'Tomorrow';
    return fmtDate(iso);
  }
  function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
  function avatar(name, photo, size) {
    const s = size ? ' style="width:' + size + 'px;height:' + size + 'px;"' : '';
    if (photo) return '<div class="a-avatar a-avatar-img"' + s + '><img src="' + esc(photo) + '" alt="" onerror="this.parentNode.textContent=\'' + initials(name) + '\'"></div>';
    const hues = [248, 210, 160, 25, 330, 280, 190];
    const h = hues[[...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
    return '<div class="a-avatar" style="background:hsl(' + h + ',60%,52%);' + (size ? 'width:' + size + 'px;height:' + size + 'px;' : '') + '">' + initials(name) + '</div>';
  }

  /* ---------- Data store (localStorage) ---------- */
  const Store = {
    data: null,
    load() {
      try { this.data = JSON.parse(localStorage.getItem(DATA_KEY)); } catch (e) { this.data = null; }
      if (!this.data || !this.data.repairs) { this.data = window.ACP_buildSeed(daysAgo); this.save(); }
      return this.data;
    },
    save() { try { localStorage.setItem(DATA_KEY, JSON.stringify(this.data)); } catch (e) { /* storage full / blocked */ } },
    reset() { try { localStorage.removeItem(DATA_KEY); } catch (e) {} this.data = null; this.load(); },
    all(c) { return this.data[c]; },
    get(c, id) { return this.data[c].find(x => x.id === id); },
    add(c, obj) { this.data[c].unshift(obj); this.save(); return obj; },
    update(c, id, patch) { const o = this.get(c, id); if (o) { Object.assign(o, patch); this.save(); } return o; },
    remove(c, id) { this.data[c] = this.data[c].filter(x => x.id !== id); this.save(); },
    nextId(c, prefix, width) {
      let max = 0;
      this.data[c].forEach(x => { const n = parseInt(String(x.id).replace(/\D/g, ''), 10); if (n > max) max = n; });
      return prefix + String(max + 1).padStart(width || 3, '0');
    }
  };
  Store.load();

  /* ---------- Lookups & business rules ---------- */
  const Q = {
    customer: id => Store.get('customers', id),
    mechanic: id => Store.get('mechanics', id),
    supplier: id => Store.get('suppliers', id),
    part: id => Store.get('inventory', id),
    customerName: id => (Store.get('customers', id) || {}).name || 'Unknown',
    mechanicName: id => id === 'admin' ? 'Admin' : ((Store.get('mechanics', id) || {}).name || '—'),
    supplierName: id => (Store.get('suppliers', id) || {}).name || '—',
    activeJobs: mid => Store.all('repairs').filter(r => r.mechanicId === mid && (r.status === 'pending' || r.status === 'progress')).length,
    completedJobs: mid => Store.all('repairs').filter(r => r.mechanicId === mid && r.status === 'complete').length,
    mechanicState(m) {
      if (m.status === 'leave') return { key: 'leave', label: 'On leave', cls: 'danger' };
      const jobs = Q.activeJobs(m.id);
      if (jobs >= 3) return { key: 'busy', label: 'Busy', cls: 'pending' };
      return { key: 'available', label: 'Available', cls: 'complete' };
    },
    stockState(p) {
      if (p.stock <= 0) return { key: 'out', label: 'Out of stock', cls: 'danger' };
      if (p.stock <= p.reorder) return { key: 'low', label: 'Low stock', cls: 'pending' };
      return { key: 'ok', label: 'In stock', cls: 'complete' };
    },
    poCost: o => { const p = Store.get('inventory', o.partId); return p ? p.price * o.qty : 0; },
    lowStock: () => Store.all('inventory').filter(p => p.stock <= p.reorder),
    pendingOrders: () => Store.all('orders').filter(o => o.status === 'pending'),
    unassigned: () => Store.all('repairs').filter(r => !r.mechanicId && r.status === 'pending')
  };

  const STATUS = {
    pending: ['Pending', 'pending'], progress: ['In Progress', 'progress'], complete: ['Complete', 'complete'],
    cancelled: ['Cancelled', 'muted'], approved: ['Approved', 'progress'], received: ['Received', 'complete'],
    rejected: ['Rejected', 'danger'], active: ['Active', 'complete'], inactive: ['Inactive', 'muted']
  };
  function badge(status, labelOverride) {
    const s = STATUS[status] || [status, 'muted'];
    return '<span class="a-badge a-badge-' + s[1] + '">' + esc(labelOverride || s[0]) + '</span>';
  }
  const PRIORITY = { normal: 'Normal', high: 'High', urgent: 'Urgent' };
  function priorityTag(p) {
    if (!p || p === 'normal') return '';
    return '<span class="a-priority a-priority-' + p + '">' + PRIORITY[p] + '</span>';
  }

  /* ---------- Session / auth ---------- */
  const Auth = {
    get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } },
    set(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {} },
    clear() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  };
  const page = document.body.dataset.page;
  if (page !== 'login' && !Auth.get()) { location.replace('login.html'); return; }
  const session = Auth.get() || { name: 'Admin', email: 'admin@autocare.bt' };

  /* ---------- Layout: sidebar, topbar extras ---------- */
  function renderSidebar() {
    const el = document.getElementById('aSidebar');
    if (!el) return;
    const pendingRepairs = Store.all('repairs').filter(r => r.status === 'pending').length;
    const pendingPO = Q.pendingOrders().length;
    const low = Q.lowStock().length;
    const link = (href, key, icon, label, count, tone) =>
      '<li><a href="' + href + '"' + (page === key ? ' class="active"' : '') + '><i class="bi ' + icon + '"></i> ' + label +
      (count ? '<span class="a-nav-count ' + (tone || '') + '">' + count + '</span>' : '') + '</a></li>';
    el.innerHTML =
      '<div class="a-brand"><div class="a-brand-logo"><img src="../repairCar/media/logo.jpg" alt="AutoCare Pro logo"></div>' +
      '<div class="a-brand-text"><strong>AutoCare Pro</strong><small>Admin panel</small></div></div>' +
      '<div class="a-nav-group"><span class="a-nav-label">Main</span><ul class="a-nav">' +
      link('index.html', 'dashboard', 'bi-grid-1x2-fill', 'Dashboard') +
      link('repairs.html', 'repairs', 'bi-wrench-adjustable', 'Repairs', pendingRepairs) +
      link('order.html', 'orders', 'bi-bag-check', 'Purchase Orders', pendingPO) +
      '</ul></div>' +
      '<div class="a-nav-group"><span class="a-nav-label">Manage</span><ul class="a-nav">' +
      link('customers.html', 'customers', 'bi-people-fill', 'Customers') +
      link('mechanics.html', 'mechanics', 'bi-person-badge', 'Mechanics') +
      link('inventory.html', 'inventory', 'bi-box-seam', 'Inventory', low, 'red') +
      link('suppliers.html', 'suppliers', 'bi-truck', 'Suppliers') +
      '</ul></div>' +
      '<div class="a-nav-group"><span class="a-nav-label">Other</span><ul class="a-nav">' +
      '<li><a href="../repairCar/index.html" target="_blank"><i class="bi bi-globe2"></i> View website</a></li>' +
      '<li><a href="#" id="resetDemo"><i class="bi bi-arrow-counterclockwise"></i> Reset demo data</a></li>' +
      '</ul></div>' +
      '<div class="a-user-foot"><div class="a-user-info">' + avatar(session.name) +
      '<div class="a-user-text"><strong>' + esc(session.name) + '</strong><small>' + esc(session.email) + '</small></div></div>' +
      '<a href="login.html?logout=1" class="a-logout"><i class="bi bi-box-arrow-right"></i> Log out</a></div>';

    document.getElementById('resetDemo').addEventListener('click', async e => {
      e.preventDefault();
      const ok = await UI.confirm('All changes you made (new repairs, edits, deletions) will be lost and the sample data restored.', { title: 'Reset demo data?', okText: 'Reset', danger: true });
      if (ok) { Store.reset(); location.reload(); }
    });
  }

  function renderTopbarExtras() {
    const chip = document.querySelector('.a-user-chip');
    if (chip) chip.innerHTML = '<span>' + esc(session.name) + '</span>' + avatar(session.name);

    const actions = document.querySelector('.a-topbar-actions');
    if (!actions) return;
    const alerts = [];
    Q.unassigned().forEach(r => alerts.push({ icon: 'bi-person-exclamation', tone: 'orange', text: '<strong>' + r.id + '</strong> needs a mechanic', sub: r.vehicle + ' · ' + r.service, href: 'repairs.html?open=' + r.id }));
    Q.pendingOrders().forEach(o => alerts.push({ icon: 'bi-bag', tone: 'blue', text: '<strong>' + o.id + '</strong> awaiting approval', sub: o.qty + ' × ' + ((Q.part(o.partId) || {}).name || 'part'), href: 'order.html' }));
    Q.lowStock().forEach(p => alerts.push({ icon: 'bi-exclamation-triangle', tone: 'red', text: '<strong>' + esc(p.name) + '</strong> ' + (p.stock ? 'is running low' : 'is out of stock'), sub: p.stock + ' left · reorder at ' + p.reorder, href: 'inventory.html' }));

    const wrap = document.createElement('div');
    wrap.className = 'dropdown';
    wrap.innerHTML =
      '<button class="a-icon-btn" data-bs-toggle="dropdown" aria-label="Notifications"><i class="bi bi-bell"></i>' +
      (alerts.length ? '<span class="a-notif-dot">' + Math.min(alerts.length, 9) + '</span>' : '') + '</button>' +
      '<div class="dropdown-menu dropdown-menu-end a-notif-menu"><div class="a-notif-head">Notifications <span>' + alerts.length + '</span></div>' +
      (alerts.length ? alerts.slice(0, 8).map(a =>
        '<a class="a-notif-item" href="' + a.href + '"><div class="a-item-icon a-icon-' + a.tone + '"><i class="bi ' + a.icon + '"></i></div>' +
        '<div><div>' + a.text + '</div><small>' + esc(a.sub) + '</small></div></a>').join('')
        : '<div class="a-empty-sm">You\'re all caught up.</div>') +
      '</div>';
    actions.insertBefore(wrap, chip || null);
  }

  function bindSidebarToggle() {
    const sb = document.getElementById('aSidebar');
    let backdrop = document.querySelector('.a-backdrop');
    if (!backdrop) { backdrop = document.createElement('div'); backdrop.className = 'a-backdrop'; document.body.appendChild(backdrop); }
    document.addEventListener('click', e => {
      if (e.target.closest('.a-sidebar-toggle')) { sb.classList.toggle('open'); backdrop.classList.toggle('show'); }
    });
    backdrop.addEventListener('click', () => { sb.classList.remove('open'); backdrop.classList.remove('show'); });
  }

  /* ---------- UI: toast, confirm, form & view modals ---------- */
  const UI = {
    toast(msg, type) {
      let box = document.getElementById('aToasts');
      if (!box) { box = document.createElement('div'); box.id = 'aToasts'; box.className = 'a-toasts'; document.body.appendChild(box); }
      const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warn: 'bi-exclamation-triangle-fill' };
      const t = document.createElement('div');
      t.className = 'a-toast a-toast-' + (type || 'success');
      t.innerHTML = '<i class="bi ' + (icons[type] || icons.success) + '"></i><span>' + msg + '</span>';
      box.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
    },

    _modal(id) {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'modal fade a-modal'; el.id = id; el.tabIndex = -1;
        el.innerHTML = '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"></div></div>';
        document.body.appendChild(el);
      }
      return el;
    },

    confirm(message, opts) {
      opts = opts || {};
      return new Promise(resolve => {
        const el = UI._modal('aConfirm');
        el.querySelector('.modal-dialog').className = 'modal-dialog modal-dialog-centered modal-sm';
        el.querySelector('.modal-content').innerHTML =
          '<div class="modal-body text-center p-4"><div class="a-confirm-icon ' + (opts.danger ? 'danger' : '') + '"><i class="bi ' + (opts.danger ? 'bi-trash3' : 'bi-question-lg') + '"></i></div>' +
          '<h5 class="a-modal-title mb-2">' + esc(opts.title || 'Are you sure?') + '</h5><p class="text-muted small mb-4">' + message + '</p>' +
          '<div class="d-flex gap-2 justify-content-center"><button class="a-btn a-btn-outline" data-bs-dismiss="modal">Cancel</button>' +
          '<button class="a-btn ' + (opts.danger ? 'a-btn-danger' : 'a-btn-primary') + '" id="aConfirmOk">' + esc(opts.okText || 'Confirm') + '</button></div></div>';
        const m = bootstrap.Modal.getOrCreateInstance(el);
        let result = false;
        el.querySelector('#aConfirmOk').onclick = () => { result = true; m.hide(); };
        el.addEventListener('hidden.bs.modal', () => resolve(result), { once: true });
        m.show();
      });
    },

    // fields: [{name,label,type,options,required,col,min,step,placeholder,help}]
    form(opts) {
      return new Promise(resolve => {
        const el = UI._modal('aForm');
        el.querySelector('.modal-dialog').className = 'modal-dialog modal-dialog-centered modal-dialog-scrollable' + (opts.size === 'sm' ? '' : ' modal-lg');
        const v = opts.values || {};
        const fieldHtml = f => {
          const val = v[f.name] != null ? v[f.name] : (f.default != null ? f.default : '');
          const req = f.required ? ' required' : '';
          const attrs = (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') +
            (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + (f.pattern ? ' pattern="' + f.pattern + '"' : '');
          let input;
          if (f.type === 'select') {
            input = '<select class="a-form-control" name="' + f.name + '"' + req + '>' +
              (f.empty ? '<option value="">' + esc(f.empty) + '</option>' : '') +
              f.options.map(o => { const ov = typeof o === 'object' ? o.value : o, ol = typeof o === 'object' ? o.label : o; return '<option value="' + esc(ov) + '"' + (String(ov) === String(val) ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select>';
          } else if (f.type === 'textarea') {
            input = '<textarea class="a-form-control" rows="3" name="' + f.name + '"' + req + attrs + '>' + esc(val) + '</textarea>';
          } else {
            input = '<input class="a-form-control" type="' + (f.type || 'text') + '" name="' + f.name + '" value="' + esc(val) + '"' + req + attrs + '>';
          }
          return '<div class="col-md-' + (f.col || 6) + '"><label class="a-form-label">' + esc(f.label) + (f.required ? ' <span class="text-danger">*</span>' : '') + '</label>' + input +
            (f.help ? '<div class="a-form-help">' + f.help + '</div>' : '') + '</div>';
        };
        el.querySelector('.modal-content').innerHTML =
          '<form novalidate><div class="modal-header"><h5 class="a-modal-title">' + esc(opts.title) + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
          '<div class="modal-body"><div class="row g-3">' + opts.fields.map(fieldHtml).join('') + '</div></div>' +
          '<div class="modal-footer"><button type="button" class="a-btn a-btn-outline" data-bs-dismiss="modal">Cancel</button>' +
          '<button type="submit" class="a-btn a-btn-primary"><i class="bi bi-check2"></i> ' + esc(opts.submitText || 'Save') + '</button></div></form>';
        const form = el.querySelector('form');
        const m = bootstrap.Modal.getOrCreateInstance(el);
        let result = null;
        if (opts.onInput) form.addEventListener('input', () => opts.onInput(form));
        if (opts.onInput) form.addEventListener('change', () => opts.onInput(form));
        form.addEventListener('submit', e => {
          e.preventDefault();
          if (!form.checkValidity()) { form.classList.add('was-validated'); form.querySelector(':invalid').focus(); return; }
          result = {};
          opts.fields.forEach(f => {
            let x = form.elements[f.name].value.trim();
            if (f.type === 'number') x = x === '' ? 0 : Number(x);
            result[f.name] = x;
          });
          if (opts.validate) { const err = opts.validate(result); if (err) { UI.toast(err, 'error'); result = null; return; } }
          m.hide();
        });
        el.addEventListener('shown.bs.modal', () => { const first = form.querySelector('input,select,textarea'); if (first) first.focus(); if (opts.onInput) opts.onInput(form); }, { once: true });
        el.addEventListener('hidden.bs.modal', () => resolve(result), { once: true });
        m.show();
      });
    },

    view(title, bodyHtml, footerHtml, onReady) {
      const el = UI._modal('aView');
      el.querySelector('.modal-dialog').className = 'modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg';
      el.querySelector('.modal-content').innerHTML =
        '<div class="modal-header"><h5 class="a-modal-title">' + title + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
        '<div class="modal-body">' + bodyHtml + '</div>' +
        '<div class="modal-footer">' + (footerHtml || '') + '<button class="a-btn a-btn-outline" data-bs-dismiss="modal">Close</button></div>';
      const m = bootstrap.Modal.getOrCreateInstance(el);
      if (onReady) onReady(el, m);
      m.show();
      return m;
    },
    hideView() { const el = document.getElementById('aView'); if (el) bootstrap.Modal.getOrCreateInstance(el).hide(); }
  };

  /* ---------- Search + tabs helpers for list pages ---------- */
  function bindSearch(cb) {
    const input = document.querySelector('.a-search');
    if (!input) return () => '';
    input.addEventListener('input', () => cb(input.value.trim().toLowerCase()));
    document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); input.focus(); } });
    return () => input.value.trim().toLowerCase();
  }
  function bindTabs(container, cb) {
    container.addEventListener('click', e => {
      const b = e.target.closest('button[data-filter]');
      if (!b) return;
      container.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      cb(b.dataset.filter);
    });
  }
  function emptyRow(cols, text) {
    return '<tr><td colspan="' + cols + '"><div class="a-empty"><i class="bi bi-inbox"></i><p>' + (text || 'Nothing found') + '</p></div></td></tr>';
  }
  function refreshChrome() {
    // re-render sidebar counts after a change
    renderSidebar();
  }

  /* ---------- Boot ---------- */
  if (page !== 'login') {
    renderSidebar();
    renderTopbarExtras();
    bindSidebarToggle();
  }

  window.AC = { Store, Q, UI, Auth, badge, priorityTag, esc, nu, nuShort, fmtDate, relDate, today, daysAgo, initials, avatar, bindSearch, bindTabs, emptyRow, refreshChrome, session, PRIORITY };
})();
