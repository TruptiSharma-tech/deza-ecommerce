import { createContext, useContext, useState, useEffect } from "react";
import { getCart, cartKey, clearUserData } from "../utils/userStorage";

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

    // 2. Fetch the latest cart/wishlist from the backend response
    // and save to user-scoped storage
    const email = userData.email;
    
    // Transform backend cart to frontend cart structure
    if (userData.cart && Array.isArray(userData.cart)) {
      const frontendCart = userData.cart.map(item => ({
        _id: item.product?._id,
        name: item.product?.name,
        price: item.product?.price,
        image: Array.isArray(item.product?.images) ? item.product.images[0] : item.product?.image,
        qty: item.qty,
        selectedSize: item.selectedSize
      })).filter(i => i._id); // Filter out any broken references
      
      localStorage.setItem(`deza_cart_${email}`, JSON.stringify(frontendCart));
    } else {
      localStorage.setItem(`deza_cart_${email}`, JSON.stringify([]));
    }

    // Transform backend wishlist to frontend wishlist structure (just IDs or full products?)
    // Based on User model, wishlist is ref: "Product"
    if (userData.wishlist && Array.isArray(userData.wishlist)) {
      localStorage.setItem(`deza_wishlist_${email}`, JSON.stringify(userData.wishlist));
    } else {
      localStorage.setItem(`deza_wishlist_${email}`, JSON.stringify([]));
    }

    // 3. Clear any generic legacy keys
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");

    syncState();
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
    window.location.href = "/login";
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
