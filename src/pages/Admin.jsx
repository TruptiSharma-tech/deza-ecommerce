import React, { useState, useEffect, useRef } from "react";
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
import html2canvas from "html2canvas";

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

// ❌ REMOVE THESE (these were making everything black)
// ChartJS.defaults.color = "#1A1A1A";
// ChartJS.defaults.borderColor = "#1A1A1A";

ChartJS.defaults.font.family = "Poppins";

export default function Admin() {
  const navigate = useNavigate();
  const dashboardRef = useRef();

  const [activeTab, setActiveTab] = useState("dashboard");

  // Products & Reviews
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Orders & Queries
  const [orders, setOrders] = useState([]);
  const [queries, setQueries] = useState([]);

  // Filters
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterType, setFilterType] = useState("All");

  // Form States
  const [title, setTitle] = useState("");
  const [stock, setStock] = useState("");
  const [categoriesSelected, setCategoriesSelected] = useState([]);
  const [typesSelected, setTypesSelected] = useState([]);
  const [fragrance, setFragrance] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  // NEW: Sizes with Prices
  const [sizePrices, setSizePrices] = useState([
    { size: "25ml", price: "" },
    { size: "30ml", price: "" },
    { size: "50ml", price: "" },
    { size: "100ml", price: "" },
  ]);

  // Edit Product
  const [editingProduct, setEditingProduct] = useState(null);

  const categories = ["Men", "Women", "Unisex"];
  const types = ["Deza", "Recreational"];

  // ✅ PROFESSIONAL CHART OPTIONS (DARK THEME)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255,255,255,0.85)",
          font: {
            size: 12,
            weight: "600",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,15,15,0.95)",
        titleColor: "#D4AF37",
        bodyColor: "white",
        borderColor: "rgba(212,175,55,0.6)",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(255,255,255,0.75)",
          font: { size: 11, weight: "500" },
        },
        grid: {
          color: "rgba(255,255,255,0.08)",
        },
      },
      y: {
        ticks: {
          color: "rgba(255,255,255,0.75)",
          font: { size: 11, weight: "500" },
        },
        grid: {
          color: "rgba(255,255,255,0.08)",
        },
      },
    },
  };

  // Load LocalStorage
  useEffect(() => {
    const loadData = () => {
      setProducts(JSON.parse(localStorage.getItem("dezaProducts")) || []);
      setOrders(JSON.parse(localStorage.getItem("dezaOrders")) || []);
      setQueries(JSON.parse(localStorage.getItem("dezaQueries")) || []);
      setReviews(JSON.parse(localStorage.getItem("dezaReviews")) || []);
    };

    loadData();

    // Auto refresh dashboard
    window.addEventListener("storage", loadData);

    return () => window.removeEventListener("storage", loadData);
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

  const toggleCheckbox = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((x) => x !== value));
    } else {
      setList([...list, value]);
    }
  };

  // ADD PRODUCT
  const handleAddProduct = (e) => {
    e.preventDefault();

    if (
      !title ||
      !stock ||
      !categoriesSelected.length ||
      !typesSelected.length ||
      !description ||
      !images.length
    ) {
      alert("⚠ Please fill all fields & upload images!");
      return;
    }

    const validSizePrices = sizePrices.filter(
      (sp) => sp.size && sp.price !== "",
    );

    if (!validSizePrices.length) {
      alert("⚠ Please add size-wise prices!");
      return;
    }

    const newProduct = {
      id: Date.now(),
      title,
      stock: Number(stock),
      categories: categoriesSelected,
      types: typesSelected,
      fragrance,
      description,
      images,
      image: images[0],
      sold: 0,
      sizePrices: validSizePrices,
      createdAt: new Date().toISOString(),
    };

    saveProducts([newProduct, ...products]);
    alert("✅ Product added successfully!");

    setTitle("");
    setStock("");
    setCategoriesSelected([]);
    setTypesSelected([]);
    setFragrance("");
    setDescription("");
    setImages([]);
    setSizePrices([
      { size: "25ml", price: "" },
      { size: "30ml", price: "" },
      { size: "50ml", price: "" },
      { size: "100ml", price: "" },
    ]);
  };

  // DELETE PRODUCT
  const handleDeleteProduct = (id) => {
    saveProducts(products.filter((p) => p.id !== id));
    saveReviews(reviews.filter((r) => r.productId !== id));
    alert("❌ Product deleted!");
  };

  // EDIT PRODUCT
  const handleEditProduct = (product) => {
    setEditingProduct(product);

    setTitle(product.title);
    setStock(product.stock);
    setCategoriesSelected(product.categories || []);
    setTypesSelected(product.types || []);
    setFragrance(product.fragrance || "");
    setDescription(product.description || "");
    setImages(product.images || []);

    setSizePrices(
      product.sizePrices?.length
        ? product.sizePrices
        : [
            { size: "25ml", price: "" },
            { size: "30ml", price: "" },
            { size: "50ml", price: "" },
            { size: "100ml", price: "" },
          ],
    );

    setActiveTab("add");
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();

    if (!editingProduct) return;

    const updatedProduct = {
      ...editingProduct,
      title,
      stock: Number(stock),
      categories: categoriesSelected,
      types: typesSelected,
      fragrance,
      description,
      images,
      image: images[0] || editingProduct.image,
      sizePrices,
    };

    const updatedProducts = products.map((p) =>
      p.id === editingProduct.id ? updatedProduct : p,
    );

    saveProducts(updatedProducts);
    alert("✅ Product updated successfully!");

    setEditingProduct(null);
    setTitle("");
    setStock("");
    setCategoriesSelected([]);
    setTypesSelected([]);
    setFragrance("");
    setDescription("");
    setImages([]);
  };

  // ORDER UPDATE
  const updateOrderStatus = (id, status) => {
    saveOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const resolveQuery = (id) => {
    saveQueries(
      queries.map((q) => (q.id === id ? { ...q, resolved: true } : q)),
    );
  };

  // Filter Orders
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

  // Stats
  const totalProducts = products.length;
  const totalOrders = finalOrders.length;

  const totalRevenue = finalOrders.reduce(
    (acc, o) => acc + (o.totalPrice || 0),
    0,
  );

  const deliveredOrders = finalOrders.filter(
    (o) => o.status === "Delivered",
  ).length;
  const pendingOrders = finalOrders.filter(
    (o) => o.status === "Pending",
  ).length;
  const shippedOrders = finalOrders.filter(
    (o) => o.status === "Shipped",
  ).length;

  const successfulTransactions = finalOrders.filter(
    (o) => o.paymentStatus === "Success",
  ).length;

  const failedTransactions = finalOrders.filter(
    (o) => o.paymentStatus === "Failed",
  ).length;

  const sortedBySold = [...products].sort(
    (a, b) => (b.sold || 0) - (a.sold || 0),
  );

  const mostSoldProduct = sortedBySold[0]?.title || "N/A";
  const leastSoldProduct =
    sortedBySold[sortedBySold.length - 1]?.title || "N/A";

  // Ratings
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

  // Charts
  const revenueChart = {
    labels: finalOrders.map((o) => new Date(o.date).toLocaleDateString()),
    datasets: [
      {
        label: "Revenue",
        data: finalOrders.map((o) => o.totalPrice || 0),
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212,175,55,0.15)",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#D4AF37",
        pointBorderColor: "#000",
        fill: true,
      },
    ],
  };

  const categoryChart = {
    labels: categories,
    datasets: [
      {
        label: "Products by Category",
        data: categories.map(
          (c) =>
            products.filter((p) => (p.categories || []).includes(c)).length,
        ),
        backgroundColor: ["#D4AF37", "#F9F7F2", "#9B8477"],
        borderColor: "rgba(255,255,255,0.3)",
        borderWidth: 2,
      },
    ],
  };

  const typeChart = {
    labels: types,
    datasets: [
      {
        label: "Products by Type",
        data: types.map(
          (t) => products.filter((p) => (p.types || []).includes(t)).length,
        ),
        backgroundColor: ["rgba(212,175,55,0.9)", "rgba(249,247,242,0.9)"],
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
      },
    ],
  };

  const ratingsChart = {
    labels: productsWithAvgRating.map((p) => p.title),
    datasets: [
      {
        label: "Average Ratings",
        data: productsWithAvgRating.map((p) => p.avgRating),
        backgroundColor: "rgba(212,175,55,0.8)",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
      },
    ],
  };

  // Export PDF with Charts
  const exportReportWithCharts = async () => {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(18);
    doc.text("DEZA Admin Dashboard Report", 10, 15);

    doc.setFontSize(12);
    doc.text(`Report Period: ${reportPeriod}`, 10, 25);
    doc.text(`Total Products: ${totalProducts}`, 10, 35);
    doc.text(`Total Orders: ${totalOrders}`, 10, 42);
    doc.text(`Revenue Generated: ₹${totalRevenue}`, 10, 49);
    doc.text(`Delivered Orders: ${deliveredOrders}`, 10, 56);
    doc.text(`Pending Orders: ${pendingOrders}`, 10, 63);
    doc.text(`Shipped Orders: ${shippedOrders}`, 10, 70);
    doc.text(`Successful Transactions: ${successfulTransactions}`, 10, 77);
    doc.text(`Failed Transactions: ${failedTransactions}`, 10, 84);
    doc.text(`Most Sold Product: ${mostSoldProduct}`, 10, 91);
    doc.text(`Least Sold Product: ${leastSoldProduct}`, 10, 98);
    doc.text(`Highest Rated Product: ${highestRatedProduct.title}`, 10, 105);

    doc.addPage();

    const dashboardElement = dashboardRef.current;

    if (!dashboardElement) {
      alert("Dashboard not found!");
      return;
    }

    const canvas = await html2canvas(dashboardElement, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    doc.text("Dashboard Charts Snapshot", 10, 15);
    doc.addImage(imgData, "PNG", 10, 20, 190, 250);

    doc.save("DEZA-Dashboard-Report.pdf");
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
          onClick={() => {
            setActiveTab("add");
            setEditingProduct(null);
            setTitle("");
            setStock("");
            setCategoriesSelected([]);
            setTypesSelected([]);
            setFragrance("");
            setDescription("");
            setImages([]);
          }}
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
          <div className="admin-section" ref={dashboardRef}>
            <h1 className="admin-title">Welcome Admin 👑</h1>

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
                <h3>Delivered</h3>
                <p>{deliveredOrders}</p>
              </div>

              <div className="admin-card">
                <h3>Pending</h3>
                <p>{pendingOrders}</p>
              </div>

              <div className="admin-card">
                <h3>Shipped</h3>
                <p>{shippedOrders}</p>
              </div>

              <div className="admin-card">
                <h3>Successful Transactions</h3>
                <p>{successfulTransactions}</p>
              </div>

              <div className="admin-card">
                <h3>Failed Transactions</h3>
                <p>{failedTransactions}</p>
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
                <h3>Highest Rated Product</h3>
                <p>{highestRatedProduct.title}</p>
              </div>
            </div>

            {/* FILTERS + EXPORT */}
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
                <button onClick={exportReportWithCharts}>
                  Export PDF with Charts 📄
                </button>

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

            {/* CHARTS GRID */}
            <div className="charts-grid">
              <div className="chart-box">
                <h3>Revenue Trend</h3>
                <div style={{ height: "250px" }}>
                  <Line data={revenueChart} options={chartOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Products by Category</h3>
                <div style={{ height: "250px" }}>
                  <Pie data={categoryChart} options={chartOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Products by Type</h3>
                <div style={{ height: "250px" }}>
                  <Bar data={typeChart} options={chartOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Ratings Overview</h3>
                <div style={{ height: "250px" }}>
                  <Bar data={ratingsChart} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT */}
        {activeTab === "add" && (
          <div className="admin-section add-product-section">
            <h2>{editingProduct ? "Edit Product ✨" : "Add New Product ➕"}</h2>

            <form
              onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
              className="add-product-form"
            >
              <div className="form-grid">
                <label>
                  Product Name
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
              </div>

              <h4 style={{ marginTop: "15px" }}>Size Wise Prices 💰</h4>

              {sizePrices.map((sp, index) => (
                <div key={index} className="form-grid">
                  <label>
                    Size
                    <input
                      type="text"
                      value={sp.size}
                      onChange={(e) => {
                        const updated = [...sizePrices];
                        updated[index].size = e.target.value;
                        setSizePrices(updated);
                      }}
                    />
                  </label>

                  <label>
                    Price ₹
                    <input
                      type="number"
                      value={sp.price}
                      onChange={(e) => {
                        const updated = [...sizePrices];
                        updated[index].price = e.target.value;
                        setSizePrices(updated);
                      }}
                    />
                  </label>
                </div>
              ))}

              <button
                type="button"
                className="lux-btn"
                style={{ marginTop: "10px" }}
                onClick={() =>
                  setSizePrices([...sizePrices, { size: "", price: "" }])
                }
              >
                ➕ Add More Size
              </button>

              <div className="checkbox-group">
                <h4>Select Categories</h4>
                <div className="checkbox-row">
                  {categories.map((c) => (
                    <label key={c} className="check-item">
                      <input
                        type="checkbox"
                        checked={categoriesSelected.includes(c)}
                        onChange={() =>
                          toggleCheckbox(
                            c,
                            categoriesSelected,
                            setCategoriesSelected,
                          )
                        }
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="checkbox-group">
                <h4>Select Types</h4>
                <div className="checkbox-row">
                  {types.map((t) => (
                    <label key={t} className="check-item">
                      <input
                        type="checkbox"
                        checked={typesSelected.includes(t)}
                        onChange={() =>
                          toggleCheckbox(t, typesSelected, setTypesSelected)
                        }
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

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

              <button type="submit" className="lux-btn">
                {editingProduct ? "Update Product ✨" : "Add Product ➕"}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  className="lux-btn danger"
                  onClick={() => {
                    setEditingProduct(null);
                    setTitle("");
                    setStock("");
                    setCategoriesSelected([]);
                    setTypesSelected([]);
                    setFragrance("");
                    setDescription("");
                    setImages([]);
                  }}
                >
                  Cancel Edit ❌
                </button>
              )}
            </form>
          </div>
        )}

        {/* PRODUCT LIST */}
        {activeTab === "list" && (
          <div className="admin-section">
            <h2>Product List 🛍</h2>

            <div className="table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Categories</th>
                    <th>Types</th>
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
                        <img
                          src={p.image}
                          alt={p.title}
                          className="table-img"
                        />
                      </td>
                      <td>{p.title}</td>
                      <td>{(p.categories || []).join(", ")}</td>
                      <td>{(p.types || []).join(", ")}</td>
                      <td>{p.stock}</td>
                      <td>{p.sold || 0}</td>
                      <td>{p.avgRating.toFixed(1)}</td>

                      <td className="action-buttons">
                        <button
                          className="small-btn edit-btn"
                          onClick={() => handleEditProduct(p)}
                        >
                          Edit
                        </button>

                        <button
                          className="small-btn delete-btn"
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        No products found 😭
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div className="admin-section">
            <h2>Orders 📦</h2>

            <div className="table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>

                <tbody>
                  {finalOrders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.date}</td>
                      <td>₹{o.totalPrice}</td>
                      <td>{o.status}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            updateOrderStatus(o.id, e.target.value)
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {finalOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        No orders found 📭
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === "support" && (
          <div className="admin-section">
            <h2>Customer Queries 💬</h2>

            <div className="table-wrapper">
              <table className="queries-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Query</th>
                    <th>Resolved</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {queries.map((q) => (
                    <tr key={q.id}>
                      <td>{q.id}</td>
                      <td>{q.name}</td>
                      <td>{q.email}</td>
                      <td>{q.message}</td>
                      <td>{q.resolved ? "Yes" : "No"}</td>
                      <td>
                        {!q.resolved && (
                          <button
                            className="small-btn edit-btn"
                            onClick={() => resolveQuery(q.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {queries.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        No queries found 😌
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
