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

export default function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Men");
  const [type, setType] = useState("Deza");
  const [sizes, setSizes] = useState([]);
  const [fragrance, setFragrance] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const [orders, setOrders] = useState([]);
  const [queries, setQueries] = useState([]);

  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const categories = ["Men", "Women", "Unisex"];
  const types = ["Deza", "Recreational"];

  useEffect(() => {
    const storedProducts =
      JSON.parse(localStorage.getItem("dezaProducts")) || [];
    setProducts(storedProducts);

    const storedOrders = JSON.parse(localStorage.getItem("dezaOrders")) || [];
    setOrders(storedOrders);

    const storedQueries = JSON.parse(localStorage.getItem("dezaQueries")) || [];
    setQueries(storedQueries);
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

  const handleAddProduct = (e) => {
    e.preventDefault();

    if (!title || !price || !stock || !sizes.length || !description || !image) {
      alert("⚠ Fill all fields & upload image!");
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
      image,
      sold: 0,
    };

    const updatedProducts = [newProduct, ...products];
    saveProducts(updatedProducts);

    alert("✅ Product added successfully & updated in Shop Page!");

    setTitle("");
    setPrice("");
    setStock("");
    setCategory("Men");
    setType("Deza");
    setSizes([]);
    setFragrance("");
    setDescription("");
    setImage(null);

    // direct redirect shop page so you can see added product
    navigate("/shop");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDeleteProduct = (id) => {
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
    alert("❌ Product deleted!");
  };

  const updateOrderStatus = (id, status) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    saveOrders(updated);
  };

  const resolveQuery = (id) => {
    const updated = queries.map((q) =>
      q.id === id ? { ...q, resolved: true } : q,
    );
    saveQueries(updated);
  };

  // ============================
  // FILTER ORDERS BY REPORT PERIOD
  // ============================
  const filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.date);
    const now = new Date();

    if (reportPeriod === "daily") {
      return orderDate.toDateString() === now.toDateString();
    } else if (reportPeriod === "monthly") {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    } else if (reportPeriod === "quarterly") {
      const quarter = Math.floor(now.getMonth() / 3);
      return (
        Math.floor(orderDate.getMonth() / 3) === quarter &&
        orderDate.getFullYear() === now.getFullYear()
      );
    } else if (reportPeriod === "yearly") {
      return orderDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  // ============================
  // CATEGORY + TYPE FILTERS
  // ============================
  const finalOrders = filteredOrders.filter((o) => {
    const catMatch = filterCategory === "All" || o.category === filterCategory;
    const typeMatch = filterType === "All" || o.type === filterType;
    return catMatch && typeMatch;
  });

  // ============================
  // SALES CALCULATION FROM ORDER ITEMS
  // ============================
  const salesMap = {};

  finalOrders.forEach((order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        if (!salesMap[item.id]) salesMap[item.id] = 0;
        salesMap[item.id] += item.qty;
      });
    }
  });

  const soldProducts = products.map((p) => ({
    ...p,
    soldInPeriod: salesMap[p.id] || 0,
  }));

  const sortedSoldProducts = [...soldProducts].sort(
    (a, b) => b.soldInPeriod - a.soldInPeriod,
  );

  const mostSoldProduct = sortedSoldProducts[0]?.title || "N/A";
  const leastSoldProduct =
    sortedSoldProducts[sortedSoldProducts.length - 1]?.title || "N/A";

  // ============================
  // CATEGORY SALES BASED ON ORDERS
  // ============================
  const categorySales = categories.map((c) =>
    soldProducts
      .filter((p) => p.category === c)
      .reduce((acc, p) => acc + p.soldInPeriod, 0),
  );

  const typeSales = types.map((t) =>
    soldProducts
      .filter((p) => p.type === t)
      .reduce((acc, p) => acc + p.soldInPeriod, 0),
  );

  const mostSoldCategory =
    categories[categorySales.indexOf(Math.max(...categorySales))] || "N/A";

  const leastSoldCategory =
    categories[categorySales.indexOf(Math.min(...categorySales))] || "N/A";

  const mostSoldType =
    types[typeSales.indexOf(Math.max(...typeSales))] || "N/A";

  const leastSoldType =
    types[typeSales.indexOf(Math.min(...typeSales))] || "N/A";

  // ============================
  // KPI VALUES
  // ============================
  const totalProducts = products.length;
  const totalOrders = finalOrders.length;
  const totalRevenue = finalOrders.reduce(
    (acc, o) => acc + (o.totalPrice || 0),
    0,
  );

  // ============================
  // CHART OPTIONS (DARK TEXT + BOLD)
  // ============================
  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: "#121212",
          font: {
            size: 13,
            weight: "bold",
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#121212",
          font: { weight: "bold" },
        },
        grid: { color: "rgba(0,0,0,0.1)" },
      },
      y: {
        ticks: {
          color: "#121212",
          font: { weight: "bold" },
        },
        grid: { color: "rgba(0,0,0,0.1)" },
      },
    },
  };

  // ============================
  // CHART DATA
  // ============================
  const revenueChart = {
    labels: finalOrders.map((o) => new Date(o.date).toLocaleDateString()),
    datasets: [
      {
        label: "Revenue",
        data: finalOrders.map((o) => o.totalPrice || 0),
        borderColor: "#b8860b", // darker gold
        backgroundColor: "rgba(184,134,11,0.4)",
        borderWidth: 3,
        pointBackgroundColor: "#121212",
        pointBorderColor: "#b8860b",
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  };

  const categoryChart = {
    labels: categories,
    datasets: [
      {
        label: "Sold Products by Category",
        data: categorySales,
        backgroundColor: ["#b8860b", "#121212", "#9B8477"],
        borderWidth: 1,
      },
    ],
  };

  const typeChart = {
    labels: types,
    datasets: [
      {
        label: "Sold Products by Type",
        data: typeSales,
        backgroundColor: ["#b8860b", "#9B8477"],
        borderWidth: 1,
      },
    ],
  };

  // ============================
  // EXPORT REPORT
  // ============================
  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DEZA Perfume Sales Report", 10, 10);

    doc.setFontSize(12);
    doc.text(`Report Period: ${reportPeriod}`, 10, 20);
    doc.text(`Category Filter: ${filterCategory}`, 10, 30);
    doc.text(`Type Filter: ${filterType}`, 10, 40);

    doc.text(`Total Products: ${totalProducts}`, 10, 55);
    doc.text(`Total Orders: ${totalOrders}`, 10, 65);
    doc.text(`Revenue: ₹${totalRevenue}`, 10, 75);

    doc.text(`Most Sold Product: ${mostSoldProduct}`, 10, 90);
    doc.text(`Least Sold Product: ${leastSoldProduct}`, 10, 100);

    doc.text(`Most Sold Category: ${mostSoldCategory}`, 10, 115);
    doc.text(`Least Sold Category: ${leastSoldCategory}`, 10, 125);

    doc.text(`Most Sold Type: ${mostSoldType}`, 10, 140);
    doc.text(`Least Sold Type: ${leastSoldType}`, 10, 150);

    doc.save("deza-report.pdf");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    alert("👋 Admin logged out!");
    navigate("/admin-login");
  };

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
        {/* DASHBOARD */}
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
            </div>

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

              <div className="export-btns">
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

            <div className="charts">
              <div className="chart">
                <Line data={revenueChart} options={chartOptions} />
              </div>

              <div className="chart">
                <Pie data={categoryChart} options={chartOptions} />
              </div>

              <div className="chart">
                <Bar data={typeChart} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT */}
        {activeTab === "add" && (
          <div className="admin-section">
            <h1>Add New Product</h1>

            <form className="add-product-form" onSubmit={handleAddProduct}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Price ₹"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Men</option>
                  <option>Women</option>
                  <option>Unisex</option>
                </select>

                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Deza</option>
                  <option>Recreational</option>
                </select>

                <input
                  type="text"
                  placeholder="Sizes (comma separated) eg: 50ml, 100ml"
                  value={sizes.join(", ")}
                  onChange={(e) =>
                    setSizes(e.target.value.split(",").map((s) => s.trim()))
                  }
                />

                <input
                  type="text"
                  placeholder="Fragrance Notes"
                  value={fragrance}
                  onChange={(e) => setFragrance(e.target.value)}
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <textarea
                placeholder="Product Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <button type="submit" className="primary-btn">
                ➕ Add Product & Show in Shop
              </button>
            </form>
          </div>
        )}

        {/* PRODUCT LIST */}
        {activeTab === "list" && (
          <div className="admin-section">
            <h1>Product List</h1>

            {products.length === 0 ? (
              <p className="empty-text">No products found.</p>
            ) : (
              <div className="product-table">
                {products.map((p) => (
                  <div key={p.id} className="product-row">
                    <img src={p.image} alt={p.title} />

                    <div className="product-info">
                      <h3>{p.title}</h3>
                      <p className="muted">
                        ₹{p.price} | Stock: {p.stock}
                      </p>
                      <p className="muted">
                        Category: {p.category} | Type: {p.type}
                      </p>
                      <p className="desc">{p.description}</p>
                      <p className="muted">Sizes: {p.sizes?.join(", ")}</p>
                    </div>

                    <button
                      className="danger-btn"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div className="admin-section">
            <h1>Orders</h1>

            {orders.length === 0 ? (
              <p className="empty-text">No orders yet.</p>
            ) : (
              <div className="orders-grid">
                {orders.map((o) => (
                  <div key={o.id} className="order-card">
                    <div className="order-top">
                      <h3>Order #{o.id}</h3>
                      <span className={`status ${o.status?.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </div>

                    <p className="muted">
                      📅 {new Date(o.date).toLocaleString()}
                    </p>

                    <p className="order-total">₹{o.totalPrice}</p>

                    <label className="small-label">Update Status</label>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    >
                      <option>Pending</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === "support" && (
          <div className="admin-section">
            <h1>Customer Support</h1>

            {queries.length === 0 ? (
              <p className="empty-text">No queries available.</p>
            ) : (
              <div className="support-grid">
                {queries.map((q) => (
                  <div key={q.id} className="support-card">
                    <div className="support-top">
                      <h3>{q.name}</h3>
                      <span className="muted">{q.email}</span>
                    </div>

                    <p className="support-msg">{q.message}</p>

                    {q.resolved ? (
                      <p className="resolved">✅ Resolved</p>
                    ) : (
                      <button
                        className="primary-btn"
                        onClick={() => resolveQuery(q.id)}
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
