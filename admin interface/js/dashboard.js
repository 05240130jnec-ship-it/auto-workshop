// Dashboard — every number is calculated from the live data store
(function () {
  const { Store, Q, esc, nu, nuShort, relDate, avatar, badge, priorityTag, session } = AC;
  const repairs = Store.all('repairs');
  const now = new Date();
  const monthKey = d => d.slice(0, 7);
  const thisMonth = AC.today().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getFullYear() + '-' + String(lastMonthDate.getMonth() + 1).padStart(2, '0');

  // Greeting
  const h = now.getHours();
  document.getElementById('greet').textContent =
    (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', ' + session.name + ' · ' +
    now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Stats
  const active = repairs.filter(r => r.status === 'pending' || r.status === 'progress');
  const unassigned = Q.unassigned().length;
  const doneThis = repairs.filter(r => r.status === 'complete' && monthKey(r.date) === thisMonth);
  const revThis = doneThis.reduce((s, r) => s + r.cost, 0);
  const revLast = repairs.filter(r => r.status === 'complete' && monthKey(r.date) === lastMonth).reduce((s, r) => s + r.cost, 0);
  const trend = revLast ? Math.round((revThis - revLast) / revLast * 100) : 0;
  const low = Q.lowStock();

  const stat = (icon, tone, label, value, foot, footCls) =>
    '<div class="a-stat"><div class="a-stat-icon a-icon-' + tone + '"><i class="bi ' + icon + '"></i></div><div><h6>' + label + '</h6><div class="a-stat-value">' + value + '</div><p class="a-stat-foot ' + (footCls || '') + '">' + foot + '</p></div></div>';
  document.getElementById('stats').innerHTML =
    stat('bi-wrench-adjustable', 'purple', 'Active jobs', active.length, unassigned ? unassigned + ' waiting for a mechanic' : 'All jobs assigned', unassigned ? 'orange' : 'green') +
    stat('bi-check2-circle', 'green', 'Completed this month', doneThis.length, repairs.filter(r => r.status === 'complete').length + ' all time', 'green') +
    stat('bi-cash-stack', 'blue', 'Revenue this month', nuShort(revThis),
      revLast ? '<span class="a-trend ' + (trend >= 0 ? 'up' : 'down') + '">' + (trend >= 0 ? '▲ ' : '▼ ') + Math.abs(trend) + '%</span> vs last month' : 'From completed jobs', 'blue') +
    stat('bi-exclamation-triangle', 'red', 'Low stock items', low.length, low.length ? 'Reorder soon' : 'Stock looks healthy', low.length ? 'red' : 'green');

  // Revenue chart — last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString('en-GB', { month: 'short' }) });
  }
  months.forEach(m => { m.total = repairs.filter(r => r.status === 'complete' && monthKey(r.date) === m.key).reduce((s, r) => s + r.cost, 0); });
  const max = Math.max(...months.map(m => m.total), 1);
  document.getElementById('revTotal').textContent = 'Total ' + nu(months.reduce((s, m) => s + m.total, 0));
  const chart = document.getElementById('revChart');
  chart.innerHTML = months.map((m, i) =>
    '<div class="a-chart-col" title="' + m.label + ': ' + nu(m.total) + '"><div class="a-chart-bar' + (i === 5 ? ' current' : '') + '" style="height:0" data-h="' + Math.max(m.total / max * 100, 2) + '%"><span>' + nuShort(m.total).replace('Nu. ', '') + '</span></div><div class="a-chart-label">' + m.label + '</div></div>').join('');
  requestAnimationFrame(() => setTimeout(() => chart.querySelectorAll('.a-chart-bar').forEach(b => b.style.height = b.dataset.h), 50));

  // Status donut
  const groups = [
    ['pending', 'Pending', '#d4d928'], ['progress', 'In progress', '#2563eb'],
    ['complete', 'Complete', '#16a34a'], ['cancelled', 'Cancelled', '#cbd5e1']
  ].map(g => ({ key: g[0], label: g[1], color: g[2], n: repairs.filter(r => r.status === g[0]).length }));
  let acc = 0;
  const total = repairs.length || 1;
  const stops = groups.map(g => { const from = acc / total * 360; acc += g.n; return g.color + ' ' + from + 'deg ' + (acc / total * 360) + 'deg'; }).join(',');
  document.getElementById('statusDonut').innerHTML =
    '<div class="a-donut" style="background:conic-gradient(' + stops + ')"><div class="a-donut-center"><strong>' + repairs.length + '</strong><small>total jobs</small></div></div>' +
    '<ul class="a-legend">' + groups.map(g => '<li><i style="background:' + g.color + '"></i>' + g.label + '<b>' + g.n + '</b></li>').join('') + '</ul>';

  // Recent jobs
  const iconFor = s => ({ pending: ['bi-hourglass-split', 'orange'], progress: ['bi-gear-wide-connected', 'blue'], complete: ['bi-check-lg', 'green'], cancelled: ['bi-x-lg', 'red'] }[s]);
  document.getElementById('recentList').innerHTML = repairs.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 5).map(r => {
    const ic = iconFor(r.status);
    return '<a class="a-panel-item" href="repairs.html?open=' + r.id + '"><div class="a-item-icon a-icon-' + ic[1] + '"><i class="bi ' + ic[0] + '"></i></div>' +
      '<div class="a-item-body"><strong>' + esc(r.vehicle) + ' · ' + esc(r.service) + priorityTag(r.priority) + '</strong><small>' + r.id + ' · ' + esc(Q.customerName(r.customerId)) + ' · ' + relDate(r.date) + '</small></div>' + badge(r.status) + '</a>';
  }).join('');

  // Needs attention
  const att = [];
  Q.unassigned().forEach(r => att.push('<a class="a-panel-item" href="repairs.html?open=' + r.id + '"><div class="a-item-icon a-icon-orange"><i class="bi bi-person-exclamation"></i></div><div class="a-item-body"><strong>Assign a mechanic to ' + r.id + priorityTag(r.priority) + '</strong><small>' + esc(r.vehicle) + ' · ' + esc(r.service) + ' · booked ' + relDate(r.date).toLowerCase() + '</small></div><i class="bi bi-chevron-right text-muted"></i></a>'));
  Q.pendingOrders().forEach(o => { const p = Q.part(o.partId) || {}; att.push('<a class="a-panel-item" href="order.html"><div class="a-item-icon a-icon-blue"><i class="bi bi-bag"></i></div><div class="a-item-body"><strong>Approve ' + o.id + ' — ' + esc(p.name || '') + '</strong><small>' + o.qty + ' units · ' + nu(Q.poCost(o)) + ' · by ' + esc(Q.mechanicName(o.requestedBy)) + '</small></div><i class="bi bi-chevron-right text-muted"></i></a>'); });
  low.forEach(p => att.push('<a class="a-panel-item" href="inventory.html"><div class="a-item-icon a-icon-red"><i class="bi bi-box-seam"></i></div><div class="a-item-body"><strong>' + esc(p.name) + (p.stock ? ' running low' : ' out of stock') + '</strong><small>' + p.stock + ' left · reorder level ' + p.reorder + '</small></div><i class="bi bi-chevron-right text-muted"></i></a>'));
  document.getElementById('attentionList').innerHTML = att.length ? att.slice(0, 6).join('') + (att.length > 6 ? '<div class="small text-muted text-center pt-1">+' + (att.length - 6) + ' more in notifications</div>' : '')
    : '<div class="a-empty"><i class="bi bi-emoji-smile"></i><p>Nothing needs attention right now.</p></div>';

  // Workload
  const mechs = Store.all('mechanics');
  document.getElementById('workload').innerHTML = mechs.map(m => {
    const jobs = Q.activeJobs(m.id), st = Q.mechanicState(m);
    const pct = Math.min(jobs / 4 * 100, 100);
    const color = st.key === 'leave' ? '#cbd5e1' : jobs >= 3 ? '#ea580c' : 'var(--a-purple)';
    return '<div class="a-workload-row">' + avatar(m.name, m.photo) + '<div class="a-workload-body"><div><span>' + esc(m.name) + '</span><small>' + (st.key === 'leave' ? 'On leave' : jobs + ' active job' + (jobs === 1 ? '' : 's')) + '</small></div><div class="a-bar"><span style="width:' + pct + '%;background:' + color + '"></span></div></div></div>';
  }).join('');

  // Topbar search jumps to repairs page
  const s = document.querySelector('.a-search');
  s.addEventListener('keydown', e => { if (e.key === 'Enter' && s.value.trim()) location.href = 'repairs.html?q=' + encodeURIComponent(s.value.trim()); });
})();
