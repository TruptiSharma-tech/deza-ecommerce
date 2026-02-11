export const loginUser = (email) => {
  localStorage.setItem("userLoggedIn", "true");
  localStorage.setItem("userEmail", email);
};

export const logoutUser = () => {
  localStorage.removeItem("userLoggedIn");
  localStorage.removeItem("userEmail");
};

export const isUserLoggedIn = () => {
  return localStorage.getItem("userLoggedIn") === "true";
};

export const getUserEmail = () => {
  return localStorage.getItem("userEmail");
};
