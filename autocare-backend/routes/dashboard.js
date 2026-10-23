// Numbers for the admin dashboard — all calculated by MySQL
//   GET /api/dashboard
const express = require('express')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  // How many repairs in each status
  const [statusRows] = await db.query('SELECT status, COUNT(*) AS n FROM repairs GROUP BY status')
  const byStatus = { pending: 0, progress: 0, complete: 0, cancelled: 0 }
  statusRows.forEach((r) => { byStatus[r.status] = r.n })

  // Revenue from completed jobs, per month, for the last 6 months
  const [revenue] = await db.query(`
    SELECT DATE_FORMAT(completed_on, '%Y-%m') AS month, SUM(cost) AS total, COUNT(*) AS jobs
      FROM repairs
     WHERE status = 'complete' AND completed_on >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
     GROUP BY month ORDER BY month`)

  const [[counts]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM repairs WHERE status = 'pending' AND mechanic_id IS NULL) AS unassigned,
      (SELECT COUNT(*) FROM inventory WHERE stock <= reorder_level) AS low_stock,
      (SELECT COUNT(*) FROM purchase_orders WHERE status = 'pending') AS pending_orders,
      (SELECT COUNT(*) FROM customers WHERE status = 'active') AS active_customers,
      (SELECT COUNT(*) FROM listings WHERE status = 'review') AS listings_to_review,
      (SELECT COUNT(*) FROM reservations WHERE status = 'ready') AS orders_to_collect`)

  // Workload per mechanic
  const [workload] = await db.query(`
    SELECT m.id, m.name, m.status, m.photo, COALESCE(SUM(r.status IN ('pending','progress')), 0) AS active_jobs
      FROM mechanics m LEFT JOIN repairs r ON r.mechanic_id = m.id
     GROUP BY m.id ORDER BY m.id`)

  res.json({
    repairs_by_status: byStatus,
    revenue_by_month: revenue.map((r) => ({ month: r.month, total: Number(r.total), jobs: r.jobs })),
    ...counts,
    workload: workload.map((w) => ({ ...w, active_jobs: Number(w.active_jobs) })),
  })
})

module.exports = router
