export const createDefaultAdmin = () => {
  const admin = localStorage.getItem("adminAccount");

  if (!admin) {
    localStorage.setItem(
      "adminAccount",
      JSON.stringify({
        email: "admin@deza.com",
        password: "Deza@2026",
        role: "admin",
      })
    );
  }
};
