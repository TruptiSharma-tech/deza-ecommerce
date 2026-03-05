import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    const token = localStorage.getItem("deza_token");
    if (storedUser && token) setUser(storedUser);
  }, []);

  // Called after successful API login/register
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    if (token) localStorage.setItem("deza_token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
