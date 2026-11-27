// data/cart.js — talks to the shopping cart in the backend (/api/cart, saved in MySQL).
// After every change it tells the navbar (event "cart-changed") so the cart number updates.
import { api } from '../api.js'

const changed = () => window.dispatchEvent(new Event('cart-changed'))

// Add a product to my cart:  await addToCart('P-101', 2)
export async function addToCart(partId, qty = 1) {
  const cart = await api('/cart', { method: 'POST', body: { partId, qty } })
  changed()
  return cart
}

// Change the quantity of a product in my cart
export async function setCartQty(partId, qty) {
  const cart = await api('/cart/' + encodeURIComponent(partId), { method: 'PATCH', body: { qty } })
  changed()
  return cart
}

// Remove a product from my cart
export async function removeFromCart(partId) {
  const cart = await api('/cart/' + encodeURIComponent(partId), { method: 'DELETE' })
  changed()
  return cart
}

// Order the ticked products of my cart → { ids: ['R-1012', ...], total }
// (the products that are not ticked stay in the cart)
export async function checkoutCart(pickup, partIds) {
  const result = await api('/cart/checkout', { method: 'POST', body: { pickup, partIds } })
  changed()
  return result
}
