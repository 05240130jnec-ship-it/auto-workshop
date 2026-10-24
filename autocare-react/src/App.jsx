import { Routes, Route } from 'react-router-dom'
import RequireRole from './auth/RequireRole.jsx'

// Shared pages
import Login from './pages/Login.jsx'
import NoAccess from './pages/NoAccess.jsx'
import NotFound from './pages/NotFound.jsx'

// Customer website (from your repairCar folder)
import SiteLayout from './layouts/SiteLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import Home from './pages/site/Home.jsx'
import About from './pages/site/About.jsx'
import Services from './pages/site/Services.jsx'
import ServiceEngine from './pages/site/ServiceEngine.jsx'
import ServiceBrake from './pages/site/ServiceBrake.jsx'
import ServiceOil from './pages/site/ServiceOil.jsx'
import ServiceCarWash from './pages/site/ServiceCarWash.jsx'
import Shop from './pages/site/Shop.jsx'
import ShopAccessories from './pages/site/ShopAccessories.jsx'
import ShopCleaning from './pages/site/ShopCleaning.jsx'
import ShopSafety from './pages/site/ShopSafety.jsx'
import Contact from './pages/site/Contact.jsx'
import Booking from './pages/site/Booking.jsx'
import Confirm from './pages/site/Confirm.jsx'
import MyRepairs from './pages/site/MyRepairs.jsx'
import SellPart from './pages/site/SellPart.jsx'
import Reserve from './pages/site/Reserve.jsx'
import Signup from './pages/site/Signup.jsx'
import ForgotPassword from './pages/site/ForgotPassword.jsx'

// Mechanic portal (from your machanic folder)
import MechanicLayout from './layouts/MechanicLayout.jsx'
import MechanicDashboard from './pages/mechanic/Dashboard.jsx'
import MechanicRepairs from './pages/mechanic/Repairs.jsx'
import RepairDetail from './pages/mechanic/RepairDetail.jsx'
import Reports from './pages/mechanic/Reports.jsx'
import Profile from './pages/mechanic/Profile.jsx'

// Admin panel (from your admin interface folder)
import AdminLayout from './layouts/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminRepairs from './pages/admin/Repairs.jsx'
import AdminOrders from './pages/admin/Orders.jsx'
import AdminShop from './pages/admin/Shop.jsx'
import AdminCustomerOrders from './pages/admin/CustomerOrders.jsx'
import AdminCustomers from './pages/admin/Customers.jsx'
import AdminMechanics from './pages/admin/Mechanics.jsx'
import AdminInventory from './pages/admin/Inventory.jsx'
import AdminSuppliers from './pages/admin/Suppliers.jsx'

const customer = (page) => <RequireRole roles={['customer']}>{page}</RequireRole>

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/no-access" element={<NoAccess />} />
      <Route element={<AuthLayout />}>
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Customer website — anyone can browse; booking/buying needs a customer login */}
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="services/engine" element={<ServiceEngine />} />
        <Route path="services/brake" element={<ServiceBrake />} />
        <Route path="services/oil" element={<ServiceOil />} />
        <Route path="services/car-wash" element={<ServiceCarWash />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/accessories" element={<ShopAccessories />} />
        <Route path="shop/cleaning" element={<ShopCleaning />} />
        <Route path="shop/safety" element={<ShopSafety />} />
        <Route path="contact" element={<Contact />} />
        <Route path="booking" element={customer(<Booking />)} />
        <Route path="confirm/:id" element={customer(<Confirm />)} />
        <Route path="my-repairs" element={customer(<MyRepairs />)} />
        <Route path="sell-part" element={customer(<SellPart />)} />
        <Route path="reserve" element={customer(<Reserve />)} />
      </Route>

      {/* Mechanic portal — mechanics only */}
      <Route path="/mechanic" element={<RequireRole roles={['mechanic']}><MechanicLayout /></RequireRole>}>
        <Route index element={<MechanicDashboard />} />
        <Route path="repairs" element={<MechanicRepairs />} />
        <Route path="repairs/:id" element={<RepairDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin panel — admins only */}
      <Route path="/admin" element={<RequireRole roles={['admin']}><AdminLayout /></RequireRole>}>
        <Route index element={<AdminDashboard />} />
        <Route path="repairs" element={<AdminRepairs />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="shop" element={<AdminShop />} />
        <Route path="customer-orders" element={<AdminCustomerOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="mechanics" element={<AdminMechanics />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
