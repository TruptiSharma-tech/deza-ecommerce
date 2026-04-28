import { createContext, useContext, useState, useEffect } from "react";
import { getCart, setCart, setWishlist, cartKey, clearUserData } from "../utils/userStorage";
import { apiSyncUserData } from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [isAccountSidebarOpen, setIsAccountSidebarOpen] = useState(false);

  const syncState = () => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
      storedUser = null;
    }
    const token = localStorage.getItem("deza_token");
    const email = storedUser?.email || null;
    
    const cart = getCart(email);
    const count = cart.reduce((total, item) => total + item.qty, 0);
    setCartCount(count);

    const wishKey = `deza_wishlist_${email || "guest"}`;
    let storedWishlist = [];
    try {
      storedWishlist = JSON.parse(localStorage.getItem(wishKey)) || [];
    } catch (e) {
      storedWishlist = [];
    }
    setWishlist(storedWishlist);

    if (storedUser && token) {
      setUser(storedUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener("cartUpdate", syncState);
    window.addEventListener("authUpdate", syncState);
    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("cartUpdate", syncState);
      window.removeEventListener("authUpdate", syncState);
    };
  }, []);

  const updateCart = async (newCart) => {
    const email = user?.email || null;
    setCart(newCart, email);
    syncState();

    if (email && localStorage.getItem("deza_token")) {
      try {
        const backendCart = newCart.map(item => ({
          product: item._id,
          qty: item.qty,
          selectedSize: item.selectedSize
        }));
        await apiSyncUserData({ cart: backendCart });
      } catch (err) {
        console.error("Failed to sync cart:", err);
      }
    }
  };

  const updateWishlist = async (newWishlist) => {
    const email = user?.email || null;
    const wishKey = `deza_wishlist_${email || "guest"}`;
    localStorage.setItem(wishKey, JSON.stringify(newWishlist));
    syncState();

    if (email && localStorage.getItem("deza_token")) {
      try {
        const wishlistIds = newWishlist.map(p => p._id || p);
        await apiSyncUserData({ wishlist: wishlistIds });
      } catch (err) {
        console.error("Failed to sync wishlist:", err);
      }
    }
  };

  const login = (userData, token) => {
    const safeUserData = { ...userData };
    delete safeUserData.cart;
    delete safeUserData.wishlist;

    setUser(safeUserData);
    localStorage.setItem("currentUser", JSON.stringify(safeUserData));
    if (token) localStorage.setItem("deza_token", token);

    const email = userData.email;
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

    let guestCart = [];
    try {
      guestCart = JSON.parse(localStorage.getItem("deza_cart_guest") || localStorage.getItem("deza_cart") || "[]");
    } catch(e) {}
    let guestWishlist = [];
    try {
      guestWishlist = JSON.parse(localStorage.getItem("deza_wishlist_guest") || localStorage.getItem("deza_wishlist") || "[]");
    } catch(e) {}
    
    guestCart.forEach(guestItem => {
        const existing = frontendCart.find(fk => String(fk._id) === String(guestItem._id) && fk.selectedSize === guestItem.selectedSize);
        if (existing) {
             existing.qty += guestItem.qty;
        } else {
             frontendCart.push(guestItem);
        }
    });

    const mergedWishlist = [...frontendWishlist];
    guestWishlist.forEach(guestItem => {
        const existing = mergedWishlist.find(fk => String(fk._id) === String(guestItem._id) || String(fk) === String(guestItem._id));
        if (!existing) mergedWishlist.push(guestItem);
    });

    localStorage.setItem(`deza_cart_${email}`, JSON.stringify(frontendCart));
    localStorage.setItem(`deza_wishlist_${email}`, JSON.stringify(mergedWishlist));

    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");
    localStorage.removeItem("deza_cart_guest");
    localStorage.removeItem("deza_wishlist_guest");

    syncState();

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

  const clearCart = async () => {
    const email = user?.email || null;
    const key = cartKey(email);
    localStorage.removeItem(key);
    localStorage.removeItem("deza_cart"); // legacy fallback
    setCartCount(0);
    
    if (email && localStorage.getItem("deza_token")) {
      try {
        await apiSyncUserData({ cart: [] });
      } catch (err) {
        console.error("Failed to clear remote cart:", err);
      }
    }
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const logout = () => {
    setUser(null);
    setCartCount(0);
    setWishlist([]);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");
    localStorage.removeItem("lastOrder");
    localStorage.removeItem("checkoutInfo");
    localStorage.removeItem("dezaOrders");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      cartCount, 
      wishlist,
      isAccountSidebarOpen,
      setIsAccountSidebarOpen,
      login, 
      logout, 
      updateCart,
      updateWishlist,
      clearCart,
      syncState 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
