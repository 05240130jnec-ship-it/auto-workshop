// AutoCare Pro — Mechanic Dashboard Interactions
document.addEventListener('click', function (e) {
  const toggle = e.target.closest('.m-sidebar-toggle');
  if (toggle) {
    document.getElementById('mSidebar').classList.toggle('open');
  }
});

document.querySelectorAll('.m-nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      document.getElementById('mSidebar').classList.remove('open');
    }
  });
});

document.querySelectorAll('.m-tabs').forEach(group => {
  group.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      if (!filter) return;
      document.querySelectorAll('[data-status]').forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.status === filter) ? '' : 'none';
      });
    });
  });
});