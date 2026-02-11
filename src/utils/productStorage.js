export const getProducts = () => {
  return JSON.parse(localStorage.getItem("products")) || [];
};

export const saveProducts = (products) => {
  localStorage.setItem("products", JSON.stringify(products));
};

export const addProduct = (product) => {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
};

export const deleteProduct = (id) => {
  const products = getProducts();
  const updated = products.filter((p) => p.id !== id);
  saveProducts(updated);
};
