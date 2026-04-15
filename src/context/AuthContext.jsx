import { createContext, useContext, useState, useEffect } from "react";
import { getCart, cartKey, clearUserData } from "../utils/userStorage";
import { apiSyncUserData } from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const syncState = () => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const token = localStorage.getItem("deza_token");

    if (storedUser && token) {
      setUser(storedUser);
      const cart = getCart(storedUser.email);
      const count = cart.reduce((total, item) => total + item.qty, 0);
      setCartCount(count);
    } else {
      setUser(null);
      setCartCount(0);
    }
  };

  useEffect(() => {
    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener("cartUpdate", syncState);
    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("cartUpdate", syncState);
    };
  }, []);

  const login = (userData, token) => {
    // 1. Save core auth data
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    if (token) localStorage.setItem("deza_token", token);

    const email = userData.email;

    // 2. Safely parse Backend Data
    let frontendCart = [];
    if (userData.cart && Array.isArray(userData.cart)) {
      frontendCart = userData.cart.map(item => ({
        _id: item.product?._id,
        name: item.product?.name,
        price: item.product?.price,
        image: Array.isArray(item.product?.images) ? item.product.images[0] : item.product?.image,
        qty: item.qty,
        selectedSize: item.selectedSize
      })).filter(i => i._id);
    }
    
    let frontendWishlist = [];
    if (userData.wishlist && Array.isArray(userData.wishlist)) {
      frontendWishlist = userData.wishlist;
    }

    // 3. ⭐ MERGE WITH GUEST DATA ⭐
    const guestCart = JSON.parse(localStorage.getItem("deza_cart_guest") || localStorage.getItem("deza_cart") || "[]");
    const guestWishlist = JSON.parse(localStorage.getItem("deza_wishlist_guest") || localStorage.getItem("deza_wishlist") || "[]");
    
    // Merge Cart: If same product & size, sum qty. Else push.
    guestCart.forEach(guestItem => {
        const existing = frontendCart.find(fk => String(fk._id) === String(guestItem._id) && fk.selectedSize === guestItem.selectedSize);
        if (existing) {
             existing.qty += guestItem.qty;
        } else {
             frontendCart.push(guestItem);
        }
    });

    // Merge Wishlist: Add if not exists
    const mergedWishlist = [...frontendWishlist];
    guestWishlist.forEach(guestItem => {
        const existing = mergedWishlist.find(fk => String(fk._id) === String(guestItem._id) || String(fk) === String(guestItem._id));
        if (!existing) mergedWishlist.push(guestItem);
    });

    // 4. Save merged data back to user-scoped localStorage
    localStorage.setItem(`deza_cart_${email}`, JSON.stringify(frontendCart));
    localStorage.setItem(`deza_wishlist_${email}`, JSON.stringify(mergedWishlist));

    // 5. Clear guest/legacy keys
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");
    localStorage.removeItem("deza_cart_guest");
    localStorage.removeItem("deza_wishlist_guest");

    syncState();

    // 6. Push merged data back to the database
    if (guestCart.length > 0 || guestWishlist.length > 0) {
        const syncPayload = {
            cart: frontendCart.map(item => ({
                product: item._id,
                qty: item.qty,
                selectedSize: item.selectedSize
            })),
            wishlist: mergedWishlist.map(p => p._id || p)
        };
        apiSyncUserData(syncPayload).catch(err => console.error("Login Sync failed:", err));
    }
  };

  const logout = () => {
    const currentEmail = user?.email;
    setUser(null);
    setCartCount(0);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
    // ✅ Do NOT clear the user-scoped cart/wishlist on logout
    // so they can see their data when they log back in.
    // But clear shared/legacy keys:
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");
    localStorage.removeItem("lastOrder");
    localStorage.removeItem("checkoutInfo");
    localStorage.removeItem("dezaOrders");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, cartCount, login, logout, syncState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
