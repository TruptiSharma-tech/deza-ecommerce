const STORAGE_KEY = "dezaProducts"; // SAME KEY AS ADMIN

export function getProducts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function addProduct(product) {
  const products = getProducts();
  products.unshift(product); // newest product first
  saveProducts(products);
}

export function deleteProduct(id) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

export function updateProduct(updatedProduct) {
  const products = getProducts().map((p) =>
    p.id === updatedProduct.id ? updatedProduct : p
  );
  saveProducts(products);
}
