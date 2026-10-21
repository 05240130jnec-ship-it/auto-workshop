import { Outlet } from 'react-router-dom'
import useTheme from '../ui/useTheme.js'

// Sign up / Forgot password pages use your repairCar styles but no navbar
export default function AuthLayout() {
  useTheme('site')
  return <Outlet />
}
