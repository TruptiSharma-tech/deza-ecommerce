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

// Dark theme for all charts
ChartJS.defaults.color = "#121212";
ChartJS.defaults.borderColor = "#121212";
ChartJS.defaults.font.family = "Poppins";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Products & Reviews
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Men");
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

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (
      !title ||
      !price ||
      !stock ||
      !sizes.length ||
      !description ||
      !images.length
    ) {
      alert("⚠ Fill all fields & upload images!");
      return;
    }

    const newProduct = {
      id: Date.now(),
      title,
      price: Number(price),
      stock: Number(stock),
      category,
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
    setTitle("");
    setPrice("");
    setStock("");
    setCategory("Men");
    setType("Deza");
    setSizes([]);
    setFragrance("");
    setDescription("");
    setImages([]);
  };

  const handleDeleteProduct = (id) => {
    saveProducts(products.filter((p) => p.id !== id));
    saveReviews(reviews.filter((r) => r.productId !== id));
    alert("❌ Product deleted!");
  };

  const addReview = (productId, rating) => {
    const newReview = { productId, rating: Number(rating) };
    saveReviews([...reviews, newReview]);
    alert("✅ Review added!");
  };

  const updateOrderStatus = (id, status) => {
    saveOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };
  const resolveQuery = (id) => {
    saveQueries(
      queries.map((q) => (q.id === id ? { ...q, resolved: true } : q)),
    );
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.date);
    const now = new Date();
    if (reportPeriod === "daily")
      return orderDate.toDateString() === now.toDateString();
    if (reportPeriod === "monthly")
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    if (reportPeriod === "quarterly")
      return (
        Math.floor(orderDate.getMonth() / 3) ===
          Math.floor(now.getMonth() / 3) &&
        orderDate.getFullYear() === now.getFullYear()
      );
    if (reportPeriod === "yearly")
      return orderDate.getFullYear() === now.getFullYear();
    return true;
  });

  const finalOrders = filteredOrders.filter((o) => {
    const catMatch = filterCategory === "All" || o.category === filterCategory;
    const typeMatch = filterType === "All" || o.type === filterType;
    return catMatch && typeMatch;
  });

  const totalProducts = products.length;
  const totalOrders = finalOrders.length;
  const totalRevenue = finalOrders.reduce(
    (acc, o) => acc + (o.totalPrice || 0),
    0,
  );

  const sortedBySold = [...products].sort((a, b) => b.sold - a.sold);
  const mostSoldProduct = sortedBySold[0]?.title || "N/A";
  const leastSoldProduct =
    sortedBySold[sortedBySold.length - 1]?.title || "N/A";

  const mostSoldCategory = categories.reduce((prev, curr) => {
    const currCount = products
      .filter((p) => p.category === curr)
      .reduce((a, p) => a + p.sold, 0);
    const prevCount = products
      .filter((p) => p.category === prev)
      .reduce((a, p) => a + p.sold, 0);
    return currCount > prevCount ? curr : prev;
  }, categories[0]);

  const leastSoldCategory = categories.reduce((prev, curr) => {
    const currCount = products
      .filter((p) => p.category === curr)
      .reduce((a, p) => a + p.sold, 0);
    const prevCount = products
      .filter((p) => p.category === prev)
      .reduce((a, p) => a + p.sold, 0);
    return currCount < prevCount ? curr : prev;
  }, categories[0]);

  const mostSoldType = types.reduce((prev, curr) => {
    const currCount = products
      .filter((p) => p.type === curr)
      .reduce((a, p) => a + p.sold, 0);
    const prevCount = products
      .filter((p) => p.type === prev)
      .reduce((a, p) => a + p.sold, 0);
    return currCount > prevCount ? curr : prev;
  }, types[0]);

  const leastSoldType = types.reduce((prev, curr) => {
    const currCount = products
      .filter((p) => p.type === curr)
      .reduce((a, p) => a + p.sold, 0);
    const prevCount = products
      .filter((p) => p.type === prev)
      .reduce((a, p) => a + p.sold, 0);
    return currCount < prevCount ? curr : prev;
  }, types[0]);

  // --- RATINGS FIX ---
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

  const ratingsChart = {
    labels: productsWithAvgRating.map((p) => p.title),
    datasets: [
      {
        label: "Average Ratings",
        data: productsWithAvgRating.map((p) => p.avgRating),
        backgroundColor: "#FFD700",
        borderColor: "#121212",
        borderWidth: 1,
      },
    ],
  };

  // --- OTHER CHARTS ---
  const revenueChart = {
    labels: finalOrders.map((o) => new Date(o.date).toLocaleDateString()),
    datasets: [
      {
        label: "Revenue",
        data: finalOrders.map((o) => o.totalPrice || 0),
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212,175,55,0.2)",
        tension: 0.3,
      },
    ],
  };

  const categoryChart = {
    labels: categories,
    datasets: [
      {
        label: "Products by Category",
        data: categories.map(
          (c) => products.filter((p) => p.category === c).length,
        ),
        backgroundColor: ["#D4AF37", "#f9f7f2", "#9B8477"],
        borderColor: "#121212",
        borderWidth: 1,
      },
    ],
  };

  const typeChart = {
    labels: types,
    datasets: [
      {
        label: "Products by Type",
        data: types.map((t) => products.filter((p) => p.type === t).length),
        backgroundColor: ["#D4AF37", "#f9f7f2"],
        borderColor: "#121212",
        borderWidth: 1,
      },
    ],
  };

  // --- EXPORT REPORT ---
  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DEZA Perfume Sales Report", 10, 10);
    doc.setFontSize(12);
    doc.text(`Report Period: ${reportPeriod}`, 10, 20);
    doc.text(`Total Products: ${totalProducts}`, 10, 30);
    doc.text(`Total Orders: ${totalOrders}`, 10, 40);
    doc.text(`Revenue: ₹${totalRevenue}`, 10, 50);
    doc.text(`Most Sold Product: ${mostSoldProduct}`, 10, 60);
    doc.text(`Least Sold Product: ${leastSoldProduct}`, 10, 70);
    doc.text(`Most Sold Category: ${mostSoldCategory}`, 10, 80);
    doc.text(`Least Sold Category: ${leastSoldCategory}`, 10, 90);
    doc.text(`Most Sold Type: ${mostSoldType}`, 10, 100);
    doc.text(`Least Sold Type: ${leastSoldType}`, 10, 110);
    doc.text(`Highest Rated Product: ${highestRatedProduct.title}`, 10, 120);
    doc.save("deza-report.pdf");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    alert("👋 Admin logged out!");
    navigate("/admin-login");
  };

  // --- JSX ---
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
          ➕ Add Product
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
        {activeTab === "dashboard" && (
          <div className="admin-section">
            <h1>Welcome Admin 👑</h1>
            <div className="admin-cards">
              <div className="admin-card">
                <h3>Total Products</h3>
                <p>{totalProducts}</p>
              </div>
              <div className="admin-card">
                <h3>Total Orders</h3>
                <p>{totalOrders}</p>
              </div>
              <div className="admin-card">
                <h3>Total Revenue</h3>
                <p>₹{totalRevenue}</p>
              </div>
              <div className="admin-card">
                <h3>Most Sold Product</h3>
                <p>{mostSoldProduct}</p>
              </div>
              <div className="admin-card">
                <h3>Least Sold Product</h3>
                <p>{leastSoldProduct}</p>
              </div>
              <div className="admin-card">
                <h3>Most Sold Category</h3>
                <p>{mostSoldCategory}</p>
              </div>
              <div className="admin-card">
                <h3>Least Sold Category</h3>
                <p>{leastSoldCategory}</p>
              </div>
              <div className="admin-card">
                <h3>Most Sold Type</h3>
                <p>{mostSoldType}</p>
              </div>
              <div className="admin-card">
                <h3>Least Sold Type</h3>
                <p>{leastSoldType}</p>
              </div>
              <div className="admin-card">
                <h3>Highest Rated Product</h3>
                <p>{highestRatedProduct.title}</p>
              </div>
            </div>

            {/* Filters + Export buttons */}
            <div className="filters-export-container">
              <div className="filters">
                <div className="filter-item">
                  <label>Report Period</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label>Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="All">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="All">All</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="export-btns-container">
                <button onClick={exportReport}>Export PDF</button>
                <CSVLink
                  className="csv-link"
                  data={finalOrders.map((o) => ({
                    id: o.id,
                    date: o.date,
                    total: o.totalPrice,
                    status: o.status,
                  }))}
                >
                  Export CSV
                </CSVLink>
              </div>
            </div>

            {/* Charts */}
            <div className="charts">
              <div className="chart chart-large">
                <Line data={revenueChart} />
              </div>
              <div className="chart chart-medium">
                <Pie data={categoryChart} />
              </div>
              <div className="chart chart-small">
                <Bar data={typeChart} />
              </div>
              <div className="chart chart-large">
                <Bar data={ratingsChart} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
