// ✅ Legacy auth helpers kept for compatibility — prefer useAuth() from AuthContext instead.
// These now simply mirror localStorage state. Do not add new logic here.

export const loginUser = (email) => {
  localStorage.setItem("userLoggedIn", "true");
  localStorage.setItem("userEmail", email);
};

export const logoutUser = () => {
  localStorage.removeItem("userLoggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("deza_token");
};

export const isUserLoggedIn = () => {
  return !!localStorage.getItem("deza_token") && !!localStorage.getItem("currentUser");
};

export const getUserEmail = () => {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  return user?.email || localStorage.getItem("userEmail") || null;
};
