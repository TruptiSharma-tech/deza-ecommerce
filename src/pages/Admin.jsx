import React, { useState, useEffect } from "react";
import "./Admin.css";
import { useNavigate } from "react-router-dom";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Dark theme for charts
ChartJS.defaults.color = "#121212";
ChartJS.defaults.borderColor = "#121212";
ChartJS.defaults.font.family = "Poppins";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Products & Reviews
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Add/Edit product form states
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoriesSelected, setCategoriesSelected] = useState([]);
  const [type, setType] = useState("Deza");
  const [sizes, setSizes] = useState([]);
  const [fragrance, setFragrance] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  // Orders & Queries
  const [orders, setOrders] = useState([]);
  const [queries, setQueries] = useState([]);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const categories = ["Men", "Women", "Unisex"];
  const types = ["Deza", "Recreational"];

  useEffect(() => {
    setProducts(JSON.parse(localStorage.getItem("dezaProducts")) || []);
    setOrders(JSON.parse(localStorage.getItem("dezaOrders")) || []);
    setQueries(JSON.parse(localStorage.getItem("dezaQueries")) || []);
    setReviews(JSON.parse(localStorage.getItem("dezaReviews")) || []);
  }, []);

  const saveProducts = (updated) => {
    setProducts(updated);
    localStorage.setItem("dezaProducts", JSON.stringify(updated));
  };

  const saveOrders = (updated) => {
    setOrders(updated);
    localStorage.setItem("dezaOrders", JSON.stringify(updated));
  };

  const saveQueries = (updated) => {
    setQueries(updated);
    localStorage.setItem("dezaQueries", JSON.stringify(updated));
  };

  const saveReviews = (updated) => {
    setReviews(updated);
    localStorage.setItem("dezaReviews", JSON.stringify(updated));
  };

  // --- IMAGE UPLOAD ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((uploadedImages) => setImages(uploadedImages));
  };

  // --- ADD OR UPDATE PRODUCT ---
  const handleAddOrUpdateProduct = (e) => {
    e.preventDefault();
    if (
      !title ||
      !price ||
      !stock ||
      !categoriesSelected.length ||
      !sizes.length ||
      !description ||
      !images.length
    ) {
      alert("⚠ Fill all fields & upload images!");
      return;
    }

    if (editingId) {
      // Update product
      const updatedProducts = products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title,
              price: Number(price),
              stock: Number(stock),
              category: categoriesSelected,
              type,
              sizes,
              fragrance,
              description,
              images,
              image: images[0],
            }
          : p,
      );
      saveProducts(updatedProducts);
      alert("✅ Product updated successfully!");
    } else {
      // Add new product
      const newProduct = {
        id: Date.now(),
        title,
        price: Number(price),
        stock: Number(stock),
        category: categoriesSelected,
        type,
        sizes,
        fragrance,
        description,
        images,
        image: images[0],
        sold: 0,
      };
      saveProducts([newProduct, ...products]);
      alert("✅ Product added successfully!");
    }

    // Reset form
    setEditingId(null);
    setTitle("");
    setPrice("");
    setStock("");
    setCategoriesSelected([]);
    setType("Deza");
    setSizes([]);
    setFragrance("");
    setDescription("");
    setImages([]);
  };

  // --- DELETE PRODUCT ---
  const handleDeleteProduct = (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    saveProducts(products.filter((p) => p.id !== id));
    saveReviews(reviews.filter((r) => r.productId !== id));
    alert("❌ Product deleted!");
  };

  // --- EDIT PRODUCT ---
  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setPrice(product.price);
    setStock(product.stock);
    setCategoriesSelected(product.category);
    setType(product.type);
    setSizes(product.sizes);
    setFragrance(product.fragrance);
    setDescription(product.description);
    setImages(product.images);
    setActiveTab("add");
  };

  // --- CATEGORY CHECKBOX HANDLER ---
  const handleCategoryToggle = (cat) => {
    if (categoriesSelected.includes(cat)) {
      setCategoriesSelected(categoriesSelected.filter((c) => c !== cat));
    } else {
      setCategoriesSelected([...categoriesSelected, cat]);
    }
  };

  // --- EXPORT REPORT ---
  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DEZA Perfume Sales Report", 10, 10);
    doc.setFontSize(12);
    doc.text(`Report Period: ${reportPeriod}`, 10, 20);
    doc.text(`Total Products: ${products.length}`, 10, 30);
    const totalOrders = orders.length;
    doc.text(`Total Orders: ${totalOrders}`, 10, 40);
    const totalRevenue = orders.reduce((a, o) => a + (o.totalPrice || 0), 0);
    doc.text(`Revenue: ₹${totalRevenue}`, 10, 50);
    doc.save("deza-report.pdf");
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    alert("👋 Admin logged out!");
    navigate("/admin-login");
  };

  // --- Dashboard Calculations ---
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const sortedBySold = [...products].sort((a, b) => b.sold - a.sold);
  const mostSoldProduct = sortedBySold[0]?.title || "N/A";
  const leastSoldProduct =
    sortedBySold[sortedBySold.length - 1]?.title || "N/A";

  // --- Average Ratings ---
  const productsWithAvgRating = products.map((p) => {
    const productReviews = reviews.filter((r) => r.productId === p.id);
    const avgRating = productReviews.length
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length
      : 0;
    return { ...p, avgRating };
  });
  const highestRatedProduct = productsWithAvgRating.reduce(
    (max, p) => (p.avgRating > max.avgRating ? p : max),
    { avgRating: 0, title: "No Products" },
  );

  return (
    <div className="admin-page">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <h2 className="admin-logo">DEZA Admin</h2>
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => setActiveTab("add")}
        >
          {editingId ? "✏️ Edit Product" : "➕ Add Product"}
        </button>
        <button
          className={activeTab === "list" ? "active" : ""}
          onClick={() => setActiveTab("list")}
        >
          🛍 Product List
        </button>
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders
        </button>
        <button
          className={activeTab === "support" ? "active" : ""}
          onClick={() => setActiveTab("support")}
        >
          💬 Support
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        {/* DASHBOARD, ADD PRODUCT, PRODUCT LIST, ORDERS, SUPPORT */}
        {/* Add your dashboard & charts as before */}

        {/* --- ADD / EDIT PRODUCT --- */}
        {activeTab === "add" && (
          <div className="admin-section add-product-section">
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <form
              onSubmit={handleAddOrUpdateProduct}
              className="add-product-form"
            >
              <label>
                Product Name
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Price ₹
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <label>
                Stock Quantity
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </label>

              <label>
                Categories
                <div className="checkbox-group">
                  {categories.map((c) => (
                    <label key={c}>
                      <input
                        type="checkbox"
                        checked={categoriesSelected.includes(c)}
                        onChange={() => handleCategoryToggle(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </label>

              <label>
                Type
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Sizes (comma separated)
                <input
                  type="text"
                  value={sizes.join(", ")}
                  onChange={(e) =>
                    setSizes(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </label>

              <label>
                Fragrance Notes
                <input
                  type="text"
                  value={fragrance}
                  onChange={(e) => setFragrance(e.target.value)}
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label>
                Upload Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>

              {images.length > 0 && (
                <div className="preview-images">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt={`preview-${i}`} />
                  ))}
                </div>
              )}

              <button type="submit">
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </form>
          </div>
        )}

        {/* --- PRODUCT LIST --- */}
        {activeTab === "list" && (
          <div className="admin-section">
            <h2>Product List</h2>
            <table className="product-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Categories</th>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Sold</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsWithAvgRating.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.image} alt={p.title} width={50} />
                    </td>
                    <td>{p.title}</td>
                    <td>{p.category.join(", ")}</td>
                    <td>{p.type}</td>
                    <td>{p.stock}</td>
                    <td>{p.sold}</td>
                    <td>{p.avgRating.toFixed(1)}</td>
                    <td>
                      <button onClick={() => handleEditProduct(p)}>Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
