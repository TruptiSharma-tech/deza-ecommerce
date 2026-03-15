import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const syncState = () => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const token = localStorage.getItem("deza_token");
    const cart = JSON.parse(localStorage.getItem("deza_cart")) || [];
    
    if (storedUser && token) setUser(storedUser);
    else setUser(null);

    const count = cart.reduce((total, item) => total + item.qty, 0);
    setCartCount(count);
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
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    if (token) localStorage.setItem("deza_token", token);
    syncState();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
    localStorage.removeItem("deza_cart");
    localStorage.removeItem("deza_wishlist");
    syncState();
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
