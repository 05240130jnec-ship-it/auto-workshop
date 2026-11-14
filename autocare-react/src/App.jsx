import { Routes, Route } from 'react-router-dom'
import RequireRole from './auth/RequireRole.jsx'

// Shared pages
import Login from './pages/Login.jsx'
import NoAccess from './pages/NoAccess.jsx'
import NotFound from './pages/NotFound.jsx'

// Customer website (from your repairCar folder)
import SiteLayout from './layouts/SiteLayout.jsx'
import Home from './pages/site/Home.jsx'
import About from './pages/site/About.jsx'
import Services from './pages/site/Services.jsx'
import ServiceDetail from './pages/site/ServiceDetail.jsx'
import ShopCategory from './pages/site/ShopCategory.jsx'
import Contact from './pages/site/Contact.jsx'
import Booking from './pages/site/Booking.jsx'
import Confirm from './pages/site/Confirm.jsx'
import MyRepairs from './pages/site/MyRepairs.jsx'
import SellPart from './pages/site/SellPart.jsx'
import Reserve from './pages/site/Reserve.jsx'
import CustomerProfile from './pages/site/Profile.jsx'
import ForgotPassword from './pages/site/ForgotPassword.jsx'

// Mechanic portal (from your machanic folder)
import MechanicLayout from './layouts/MechanicLayout.jsx'
import MechanicDashboard from './pages/mechanic/Dashboard.jsx'
import MechanicRepairs from './pages/mechanic/Repairs.jsx'
import RepairDetail from './pages/mechanic/RepairDetail.jsx'
import Reports from './pages/mechanic/Reports.jsx'
import PartsUsed from './pages/mechanic/PartsUsed.jsx'
import Profile from './pages/mechanic/Profile.jsx'

// Admin panel (from your admin interface folder)
import AdminLayout from './layouts/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminRepairs from './pages/admin/Repairs.jsx'
import AdminOrders from './pages/admin/Orders.jsx'
import AdminShop from './pages/admin/Shop.jsx'
import AdminCustomers from './pages/admin/Customers.jsx'
import AdminMechanics from './pages/admin/Mechanics.jsx'
import AdminInventory from './pages/admin/Inventory.jsx'
import AdminSuppliers from './pages/admin/Suppliers.jsx'
import AdminContent from './pages/admin/Content.jsx'
import AdminMechanicPortal from './pages/admin/MechanicPortal.jsx'
import AdminMessages from './pages/admin/Messages.jsx'

const customer = (page) => <RequireRole roles={['customer']}>{page}</RequireRole>

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/staff-login" element={<Login staff />} />
      <Route path="/signup" element={<Login signup />} />
      <Route path="/no-access" element={<NoAccess />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Customer website — anyone can browse; booking/buying needs a customer login */}
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:key" element={<ServiceDetail />} />
        <Route path="shop" element={<ShopCategory />} />
        <Route path="shop/:slug" element={<ShopCategory />} />
        <Route path="contact" element={<Contact />} />
        <Route path="booking" element={customer(<Booking />)} />
        <Route path="confirm/:id" element={customer(<Confirm />)} />
        <Route path="my-repairs" element={customer(<MyRepairs />)} />
        <Route path="sell-part" element={customer(<SellPart />)} />
        <Route path="reserve" element={customer(<Reserve />)} />
        <Route path="profile" element={customer(<CustomerProfile />)} />
      </Route>

      {/* Mechanic portal — mechanics only */}
      <Route path="/mechanic" element={<RequireRole roles={['mechanic']}><MechanicLayout /></RequireRole>}>
        <Route index element={<MechanicDashboard />} />
        <Route path="repairs" element={<MechanicRepairs />} />
        <Route path="repairs/:id" element={<RepairDetail />} />
        <Route path="parts" element={<PartsUsed />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin panel — admins only */}
      <Route path="/admin" element={<RequireRole roles={['admin']}><AdminLayout /></RequireRole>}>
        <Route index element={<AdminDashboard />} />
        <Route path="repairs" element={<AdminRepairs />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="shop" element={<AdminShop />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="mechanics" element={<AdminMechanics />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="mechanic-portal" element={<AdminMechanicPortal />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
