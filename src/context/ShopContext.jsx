import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const auth = useAuth();

  // Map AuthContext values to ShopContext for backward compatibility
  const value = {
    currentUser: auth.user,
    cartCount: auth.cartCount,
    wishlist: auth.wishlist,
    login: auth.login,
    logout: auth.logout,
    updateCart: auth.updateCart,
    updateWishlist: auth.updateWishlist,
    clearCart: auth.clearCart,
    syncState: auth.syncState
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};
