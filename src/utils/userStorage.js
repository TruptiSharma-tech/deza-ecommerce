/**
 * User-scoped localStorage helpers.
 * All cart, wishlist, and checkout data is stored under keys
 * namespaced by the logged-in user's email so different users
 * never see each other's data.
 */

export const getUserEmail = () => {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    return user?.email ? user.email.toLowerCase().trim() : null;
  } catch {
    return null;
  }
};

export const cartKey = (email) => `deza_cart_${email || "guest"}`;
export const wishlistKey = (email) => `deza_wishlist_${email || "guest"}`;

export const getCart = (email) => {
  const key = cartKey(email || getUserEmail());
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
};

export const setCart = (cart, email) => {
  const key = cartKey(email || getUserEmail());
  localStorage.setItem(key, JSON.stringify(cart));
  // Also clear the old shared key if it exists
  localStorage.removeItem("deza_cart");
};

export const getWishlist = (email) => {
  const key = wishlistKey(email || getUserEmail());
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
};

export const setWishlist = (wishlist, email) => {
  const key = wishlistKey(email || getUserEmail());
  localStorage.setItem(key, JSON.stringify(wishlist));
  // Also clear the old shared key if it exists
  localStorage.removeItem("deza_wishlist");
};

export const clearUserData = (email) => {
  if (email) {
    localStorage.removeItem(cartKey(email));
    localStorage.removeItem(wishlistKey(email));
  }
  // Always clear legacy shared keys too
  localStorage.removeItem("deza_cart");
  localStorage.removeItem("deza_wishlist");
  localStorage.removeItem("checkoutInfo");
  localStorage.removeItem("lastOrder");
  localStorage.removeItem("dezaOrders");
};
