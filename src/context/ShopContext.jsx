import React, { createContext, useContext, useState, useEffect } from "react";

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const syncState = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];
    
    setCurrentUser(user);
    
    // Calculate cart count based on individual items
    const count = cart.reduce((total, item) => total + item.qty, 0);
    setCartCount(count);
  };

  useEffect(() => {
    syncState();

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
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    setIsLoggedOut(true);
    syncState();
    window.location.href = "/login";
  };

  const updateCart = (newCart) => {
    localStorage.setItem("deza_cart", JSON.stringify(newCart));
    syncState();
  };

  return (
    <ShopContext.Provider value={{
      currentUser,
      cartCount,
      login,
      logout,
      updateCart,
      syncState
    }}>
      {children}
    </ShopContext.Provider>
  );
};
