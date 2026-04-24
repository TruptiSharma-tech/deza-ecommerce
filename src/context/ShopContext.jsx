import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserEmail, getCart, setCart as saveCart } from "../utils/userStorage";
import { apiSyncUserData } from "../utils/api";

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);

  const syncState = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const email = user?.email || null;
    
    // Load user-specific data
    const cart = getCart(email);
    const storedWishlist = JSON.parse(localStorage.getItem(`deza_wishlist_${email}`)) || [];
    
    setCurrentUser(user);
    setWishlist(storedWishlist);
    
    // Calculate cart count based on individual items
    const count = cart.reduce((total, item) => total + item.qty, 0);
    setCartCount(count);
  };

  useEffect(() => {
    syncState();

    // 🚀 PREFETCH ESSENTIAL DATA FOR INSTANT LOADING
    import("../utils/api").then(({ apiGetHeroSettings, apiGetProducts }) => {
      apiGetHeroSettings().catch(() => {});
      apiGetProducts(false, 1, 12).catch(() => {});
    });

    // Listen to storage changes (for multiple tabs) and custom events
    window.addEventListener("storage", syncState);
    window.addEventListener("cartUpdate", syncState);
    window.addEventListener("authUpdate", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("cartUpdate", syncState);
      window.removeEventListener("authUpdate", syncState);
    };
  }, []);

  const login = (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    syncState();
  };

  const logout = () => {
    const email = getUserEmail();
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
    localStorage.removeItem("token");
    // Generic keys
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");
    localStorage.removeItem("lastOrder");
    localStorage.removeItem("checkoutInfo");
    syncState();
    window.location.href = "/login";
  };

  const updateCart = async (newCart) => {
    const email = getUserEmail();
    saveCart(newCart, email);
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
    const email = getUserEmail();
    localStorage.setItem(`deza_wishlist_${email}`, JSON.stringify(newWishlist));
    syncState();

    if (email && localStorage.getItem("deza_token")) {
      try {
        // Storing product IDs in backend
        const wishlistIds = newWishlist.map(p => p._id);
        await apiSyncUserData({ wishlist: wishlistIds });
      } catch (err) {
        console.error("Failed to sync wishlist:", err);
      }
    }
  };

  return (
    <ShopContext.Provider value={{
      currentUser,
      cartCount,
      wishlist,
      login,
      logout,
      updateCart,
      updateWishlist,
      syncState
    }}>
      {children}
    </ShopContext.Provider>
  );
};
