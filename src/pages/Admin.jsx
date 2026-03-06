import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Admin.css";
import toast from "react-hot-toast";
import { Filler } from "chart.js";
import { useNavigate } from "react-router-dom";
import {
  apiGetProducts, apiAddProduct, apiUpdateProduct, apiDeleteProduct,
  apiGetOrders, apiUpdateOrderStatus,
  apiGetQueries, apiUpdateQuery, apiReplyQuery, apiInitiateRefund,
  apiGetReviews, apiDeleteReview,
  apiGetUsers, apiDeleteUser,
  apiGetCategories, apiAddCategory,
  apiGetBrands, apiAddBrand,
  apiGetSubscribers,
  apiGetCoupons, apiAddCoupon,
  apiGetAuditLogs,
} from "../utils/api";
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
  Filler,
);

const REFRESH_INTERVAL = 5000; // Real-time sync every 5 seconds ⚡

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

  // New Collections
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Support Reply State
  const [replyInputs, setReplyInputs] = useState({});

  // Filters
  const [reportPeriod, setReportPeriod] = useState("all");
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
        position: 'top',
        labels: {
          color: "#fff",
          font: { family: 'Poppins', size: 12, weight: '600' },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        titleColor: "#D4AF37",
        bodyColor: "#fff",
        borderColor: "rgba(212, 175, 55, 0.4)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
        ticks: { color: "rgba(255, 255, 255, 0.5)", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
        ticks: { color: "rgba(255, 255, 255, 0.5)", font: { size: 11 } },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // ✅ Notification State
  const [notifications, setNotifications] = useState([]);
  const prevOrderRef = useRef(0);
  const prevQueryRef = useRef(0);
  const firstLoadRef = useRef(true);

  // ✅ Real-time Auto-Refresh
  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      loadAll(true); // silent refresh
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [prods, ords, qrys, revs, cats, brnds, subs, cpns, logs, usrs] = await Promise.all([
        apiGetProducts().catch(e => { console.error("Products error:", e); return []; }),
        apiGetOrders().catch(e => { console.error("Orders error:", e); return []; }),
        apiGetQueries().catch(e => { console.error("Queries error:", e); return []; }),
        apiGetReviews().catch(e => { console.error("Reviews error:", e); return []; }),
        apiGetCategories().catch(e => { console.error("Categories error:", e); return []; }),
        apiGetBrands().catch(e => { console.error("Brands error:", e); return []; }),
        apiGetSubscribers().catch(e => { console.error("Subscribers error:", e); return []; }),
        apiGetCoupons().catch(e => { console.error("Coupons error:", e); return []; }),
        apiGetAuditLogs().catch(e => { console.error("AuditLogs error:", e); return []; }),
        apiGetUsers().catch(e => { console.error("Users error:", e); return []; }),
      ]);

      console.log("Admin Data Loaded:", { prods: prods.length, ords: ords.length, qrys: qrys.length, cats: cats.length });

      // ✅ New Order Notification Logic
      if (!firstLoadRef.current && ords.length > prevOrderRef.current) {
        const newCount = ords.length - prevOrderRef.current;
        const newNotify = {
          id: Date.now(),
          message: `🎉 ${newCount} New Order(s) Received!`,
          time: new Date().toLocaleTimeString()
        };
        setNotifications(prev => [newNotify, ...prev].slice(0, 10));

        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play();
        } catch (e) { }
      }

      // ✅ New Query Notification Logic
      if (!firstLoadRef.current && qrys.length > prevQueryRef.current) {
        const newCount = qrys.length - prevQueryRef.current;
        const newNotify = {
          id: Date.now() + 1,
          message: `📬 ${newCount} New Support Query!`,
          time: new Date().toLocaleTimeString()
        };
        setNotifications(prev => [newNotify, ...prev].slice(0, 10));
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play();
        } catch (e) { }
      }

      prevOrderRef.current = ords.length;
      prevQueryRef.current = qrys.length;
      firstLoadRef.current = false;

      setProducts(prods);
      setOrders(ords);
      setQueries(qrys);
      setReviews(revs);
      setCategoriesList(cats);
      setBrandsList(brnds);
      setSubscribers(subs);
      setCoupons(cpns);
      setUsers(usrs);
      setAuditLogs(logs);

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Critical Admin Load Error:", err);
      setError("Failed to connect to server. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Computed Sales Ticker (Live data)
  const recentSalesTicker = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(o => `${o.customerName} just ordered ₹${o.totalPrice}!`)
      .join(" • ");
  }, [orders]);

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
  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !stock ||
      !categoriesSelected.length ||
      !typesSelected.length ||
      !description.trim() ||
      !images.length
    ) {
      toast.error("Please fill all fields & upload images!");
      return;
    }

    if (Number(stock) < 0) {
      toast.error("Stock cannot be negative!");
      return;
    }

    const validSizePrices = sizePrices.filter(
      (sp) => sp.size.trim() !== "" && sp.price !== "",
    );

    if (!validSizePrices.length) {
      toast.error("Please add valid size-wise prices!");
      return;
    }

    const negativePrice = validSizePrices.find((sp) => Number(sp.price) < 0);
    if (negativePrice) {
      toast.error("Price cannot be negative!");
      return;
    }

    try {
      const newProduct = await apiAddProduct({
        title,
        stock: Number(stock),
        categories: categoriesSelected,
        types: typesSelected,
        fragrance,
        description,
        images,
        image: images[0],
        sizePrices: validSizePrices,
      });

      setProducts([newProduct, ...products]);
      toast.success("Product added successfully!");
    } catch (err) {
      toast.error("Failed to add product: " + err.message);
      return;
    }

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
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await apiDeleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
      setReviews(reviews.filter((r) => r.productId !== id));
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
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

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editingProduct) return;

    if (
      !title.trim() ||
      !stock ||
      !categoriesSelected.length ||
      !typesSelected.length ||
      !description.trim() ||
      !images.length
    ) {
      toast.error("Please fill all fields & upload images!");
      return;
    }

    if (Number(stock) < 0) {
      toast.error("Stock cannot be negative!");
      return;
    }

    const validSizePrices = sizePrices.filter(
      (sp) => sp.size.trim() !== "" && sp.price !== "",
    );

    if (!validSizePrices.length) {
      toast.error("Please add valid size-wise prices!");
      return;
    }

    const negativePrice = validSizePrices.find((sp) => Number(sp.price) < 0);
    if (negativePrice) {
      toast.error("Price cannot be negative!");
      return;
    }

    try {
      const updatedProduct = await apiUpdateProduct(editingProduct._id, {
        title,
        stock: Number(stock),
        categories: categoriesSelected,
        types: typesSelected,
        fragrance,
        description,
        images,
        image: images[0] || editingProduct.image,
        sizePrices,
      });

      setProducts(products.map((p) => (p._id === editingProduct._id ? updatedProduct : p)));
      toast.success("Product updated successfully!");
    } catch (err) {
      toast.error("Failed to update: " + err.message);
      return;
    }

    setEditingProduct(null);
    setTitle("");
    setStock("");
    setCategoriesSelected([]);
    setTypesSelected([]);
    setFragrance("");
    setDescription("");
    setImages([]);
  };

  // ORDER STATUS UPDATE
  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await apiUpdateOrderStatus(id, status);
      setOrders(orders.map((o) => (o._id === id ? updated : o)));
    } catch (err) {
      toast.error("Failed to update order status: " + err.message);
    }
  };

  // UPDATE QUERY FIELD (priority / status)
  const updateQueryField = async (id, field, value) => {
    try {
      const updated = await apiUpdateQuery(id, { [field]: value });
      setQueries(queries.map((q) => (q._id === id ? updated : q)));
    } catch (err) {
      console.error("Failed to update query:", err);
    }
  };

  // SEND ADMIN REPLY
  const sendAdminReply = async (id) => {
    const replyText = replyInputs[id];

    if (!replyText) {
      toast.error("Please write a reply first!");
      return;
    }

    try {
      const updated = await apiReplyQuery(id, replyText);
      setQueries(queries.map((q) => (q._id === id ? updated : q)));
      setReplyInputs({ ...replyInputs, [id]: "" });
      toast.success("Reply sent successfully!");
    } catch (err) {
      toast.error("Failed to send reply: " + err.message);
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm("Are you sure you want to initiate a full refund for this query? This cannot be undone.")) return;

    try {
      const { query } = await apiInitiateRefund(id);
      setQueries(queries.map((q) => (q._id === id ? { ...q, refundStatus: "Initiated" } : q)));
      toast.success("Refund successfully initiated and customer has been notified via email.");
    } catch (err) {
      toast.error("Failed to initiate refund: " + err.message);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    // Priority: createdAt (ISO) > date (Locale String)
    const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(o.date);
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

    if (reportPeriod === "all") return true;

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

  const pendingQueries = queries.filter(q => q.status === "Pending").length;
  const resolvedQueries = queries.filter(q => q.status === "Resolved" || q.resolved).length;

  // Users Stats
  const customersOnly = users.filter(u => u.role === "user");

  const usersToday = customersOnly.filter(u => {
    const d = u.createdAt ? new Date(u.createdAt) : new Date();
    return d.toDateString() === new Date().toDateString();
  }).length;

  const onlineSimulated = Math.max(1, Math.floor(customersOnly.length * 0.15) || 1); // 15% online, min 1


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
    const productReviews = reviews.filter((r) => r.productId === p._id);
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
  // ✅ Aggregated Revenue Data (Grouped by Date)
  const revenueByDate = finalOrders.reduce((acc, o) => {
    const dateStr = new Date(o.date).toLocaleDateString();
    acc[dateStr] = (acc[dateStr] || 0) + (o.totalPrice || 0);
    return acc;
  }, {});

  const revenueLabels = Object.keys(revenueByDate).sort(
    (a, b) => new Date(a) - new Date(b),
  );
  const revenueValues = revenueLabels.map((label) => revenueByDate[label]);

  const revenueChart = {
    labels: revenueLabels,
    datasets: [
      {
        label: "Daily Revenue",
        data: revenueValues,
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
        backgroundColor: ["#d4af37", "#f9f7f2"],
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const ratingsChart = {
    labels: productsWithAvgRating.map((p) => p.title),
    datasets: [
      {
        label: "Average Ratings",
        data: productsWithAvgRating.map((p) => p.avgRating),
        backgroundColor: [
          "rgba(212, 175, 55, 0.7)",
          "rgba(155, 132, 119, 0.7)",
          "rgba(105, 240, 174, 0.7)",
          "rgba(79, 195, 247, 0.7)",
        ],
        borderColor: "rgba(212, 175, 55, 0.4)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  // Export PDF with Charts
  const exportReportWithCharts = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const timestamp = new Date().toLocaleString();

    // Title & Brand
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text("DEZA PREMIUM ANALYTICS", 10, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${timestamp}`, 10, 28);
    doc.text(`Report Period: ${reportPeriod.toUpperCase()}`, 10, 33);

    // Summary Box
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(10, 38, 200, 38);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Business Summary", 10, 48);

    doc.setFontSize(11);
    doc.text(`Total Revenue: INR ${totalRevenue.toLocaleString()}`, 15, 58);
    doc.text(`Total Orders: ${totalOrders}`, 15, 65);
    doc.text(`Total Products: ${totalProducts}`, 15, 72);
    doc.text(`Delivered: ${deliveredOrders} | Pending: ${pendingOrders}`, 15, 79);
    doc.text(`Most Sold: ${mostSoldProduct}`, 15, 86);
    doc.text(`Highest Rated: ${highestRatedProduct.title}`, 15, 93);

    doc.addPage();

    const dashboardElement = dashboardRef.current;

    if (!dashboardElement) {
      toast.error("Dashboard not found!");
      return;
    }

    // Capture the entire dashboard as a snapshot for visual depth
    const canvas = await html2canvas(dashboardElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#1a1a1a"
    });

    const imgData = canvas.toDataURL("image/png");

    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text("Visual Analytics Dashboard", 10, 20);

    // Maintain aspect ratio for the dashboard snapshot
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    doc.addImage(imgData, "PNG", 10, 30, imgWidth, imgHeight > 250 ? 250 : imgHeight);

    doc.save(`DEZA-Analytics-${reportPeriod}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
    toast.success("Admin logged out! 👋");
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

        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>

        <button
          className={activeTab === "reviews" ? "active" : ""}
          onClick={() => setActiveTab("reviews")}
        >
          ⭐ Reviews
        </button>

        <button
          className={activeTab === "audit" ? "active" : ""}
          onClick={() => setActiveTab("audit")}
        >
          📜 Audit Logs
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        {error && <div className="admin-error"><h2>{error} ❌</h2><button onClick={() => loadAll()}>Retry</button></div>}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="admin-section" ref={dashboardRef}>
            <div className="admin-header-flex">
              <div>
                <h1 className="admin-title">Live Dashboard 💎</h1>
                <p className="admin-subtitle">
                  Last synced: {lastUpdated.toLocaleTimeString()}
                  {loading && <span style={{ color: "#D4AF37", marginLeft: "10px", fontWeight: "bold" }}>⚡ Syncing...</span>}
                </p>
              </div>
              <button className="small-btn edit-btn" onClick={() => loadAll()} disabled={loading}>
                {loading ? "⏳ Syncing..." : "🔄 Refresh Now"}
              </button>
            </div>

            {/* LIVE TICKER */}
            {orders.length > 0 && (
              <div className="live-ticker-container">
                <div className="live-ticker-label">LATEST SALES</div>
                <div className="live-ticker-wrapper">
                  <div className="live-ticker-text-move">
                    {recentSalesTicker || "Waiting for new orders..."}
                    {recentSalesTicker && ` • ${recentSalesTicker}`}
                  </div>
                </div>
              </div>
            )}

            <div className="admin-cards">
              <div className="admin-card myntra-card blue">
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <h3>Total Customers</h3>
                  <p>{customersOnly.length}</p>
                  <small style={{ display: "block", opacity: 0.6, fontSize: "11px", marginTop: "5px" }}>
                    🔥 {onlineSimulated} Active Now | 🆕 {usersToday} Today
                  </small>
                </div>
              </div>

              <div className="admin-card myntra-card purple">
                <div className="card-icon">🛍️</div>
                <div className="card-content">
                  <h3>Total Products</h3>
                  <p>{totalProducts}</p>
                </div>
              </div>

              <div className="admin-card myntra-card gold">
                <div className="card-icon">📦</div>
                <div className="card-content">
                  <h3>Orders Received</h3>
                  <p>{totalOrders}</p>
                </div>
              </div>

              <div className="admin-card myntra-card green">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3>Total Revenue</h3>
                  <p>₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="admin-card myntra-card teal">
                <div className="card-icon">🚚</div>
                <div className="card-content">
                  <h3>Orders Delivered</h3>
                  <p>{deliveredOrders}</p>
                </div>
              </div>

              <div className="admin-card myntra-card orange">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                  <h3>Orders Pending</h3>
                  <p>{pendingOrders}</p>
                </div>
              </div>

              <div className="admin-card myntra-card blue">
                <div className="card-icon">✔</div>
                <div className="card-content">
                  <h3>Queries Solved</h3>
                  <p>{resolvedQueries}</p>
                </div>
              </div>

              <div className="admin-card myntra-card orange">
                <div className="card-icon">💬</div>
                <div className="card-content">
                  <h3>Queries Pending</h3>
                  <p>{pendingQueries}</p>
                </div>
              </div>

              <div className="admin-card myntra-card green">
                <div className="card-icon">💳</div>
                <div className="card-content">
                  <h3>Txn Success</h3>
                  <p>{successfulTransactions}</p>
                </div>
              </div>

              <div className="admin-card myntra-card" style={{ background: "linear-gradient(135deg, #e53935, #b71c1c)" }}>
                <div className="card-icon">❌</div>
                <div className="card-content">
                  <h3>Txn Failed</h3>
                  <p>{failedTransactions}</p>
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS & ACTIVITY */}
            <div className="dashboard-grid-2">
              <div className="activity-panel">
                <h3>🔔 Recent Notifications</h3>
                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="notify-item">
                        <p>{n.message}</p>
                        <span>{n.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-notify">No new notifications ☕</p>
                  )}
                </div>
              </div>

              <div className="quick-stats-panel">
                <h3>🚀 Quick Stats</h3>
                <div className="stat-row">
                  <span>Pending Orders</span>
                  <span className="count orange">{pendingOrders}</span>
                </div>
                <div className="stat-row">
                  <span>Orders Delivered</span>
                  <span className="count green">{deliveredOrders}</span>
                </div>
                <div className="stat-row">
                  <span>Pending Queries</span>
                  <span className="count orange">{pendingQueries}</span>
                </div>
                <div className="stat-row">
                  <span>Queries Solved</span>
                  <span className="count green">{resolvedQueries}</span>
                </div>
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
                    <option value="all">All Time</option>
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
                    id: o._id,
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
                <div className="chart-container-inner" style={{ flex: 1, paddingBottom: '20px' }}>
                  <Line data={revenueChart} options={chartOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Products by Category</h3>
                <div className="chart-container-inner" style={{ flex: 1, paddingBottom: '20px' }}>
                  <Pie data={categoryChart} options={chartOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Products by Type</h3>
                <div className="chart-container-inner" style={{ flex: 1, paddingBottom: '20px' }}>
                  <Bar data={typeChart} options={chartOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Ratings Overview</h3>
                <div className="chart-container-inner" style={{ flex: 1, paddingBottom: '20px' }}>
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
                    <div key={i} style={{ position: "relative" }}>
                      <img src={img} alt={`preview-${i}`} />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          background: "#ff4d4d",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
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
                    <tr key={p._id}>
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
                          onClick={() => handleDeleteProduct(p._id)}
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
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>

                <tbody>
                  {finalOrders.map((o) => (
                    <tr key={o._id}>
                      <td>{o.orderId || "DZ-" + String(o._id).slice(-6).toUpperCase()}</td>
                      <td>{new Date(o.date).toLocaleDateString()}</td>

                      <td>
                        <strong>{o.customerName || "N/A"}</strong>
                        <br />
                        {o.customerEmail || ""}
                      </td>

                      <td>
                        {o.address ? (
                          typeof o.address === "string" ? (
                            <>{o.address}</>
                          ) : (
                            <>
                              <strong>{o.customerName}</strong> <br />
                              {o.customerPhone} <br />
                              {o.address.street}, {o.address.area} <br />
                              {o.address.city}, {o.address.state} -{" "}
                              {o.address.pincode} <br />
                              {o.address.country}
                            </>
                          )
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        {(o.items || []).map((item, idx) => (
                          <div key={item._id || item.id || idx} style={{ marginBottom: "10px" }}>
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: "40px", marginRight: "5px" }}
                            />
                            <div>
                              {item.name} <br />
                              Size: {item.selectedSize} <br />
                              Qty: {item.qty}
                            </div>
                          </div>
                        ))}
                      </td>

                      <td>₹{o.totalPrice}</td>
                      <td>{o.status}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            updateOrderStatus(o._id, e.target.value)
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
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
            <h2>Customer Support Tickets 🎫</h2>

            <div className="table-wrapper">
              <table className="queries-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Issue</th>
                    <th>Order ID</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Action / Reply</th>
                  </tr>
                </thead>

                <tbody>
                  {queries.map((q) => (
                    <tr key={q._id}>
                      <td>{"DZ-TK-" + String(q._id).slice(-6).toUpperCase()}</td>
                      <td>
                        <strong>{q.name}</strong><br />
                        <small>{q.email}</small>
                      </td>
                      <td><span className="badge-premium">{q.ticketType}</span></td>
                      <td><span style={{ color: "#d4af37" }}>{q.issueType}</span></td>
                      <td>{q.orderId || "N/A"}</td>
                      <td style={{ maxWidth: "200px", fontSize: "12px" }}>{q.message}</td>

                      <td>
                        <select
                          className="admin-select-status"
                          value={q.status || "Pending"}
                          onChange={(e) =>
                            updateQueryField(q._id, "status", e.target.value)
                          }
                          style={{
                            background: q.status === "Resolved" ? "#2e7d32" : (q.status === "In Progress" ? "#f9a825" : "#1a1a1a"),
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>

                      <td>
                        {q.adminReply ? (
                          <div style={{ color: "#4CAF50" }}>
                            <strong>Reply:</strong>
                            <p>{q.adminReply}</p>
                            <small>{q.repliedAt}</small>
                          </div>
                        ) : (
                          <>
                            <select
                              style={{ width: "100%", marginBottom: "5px", padding: "5px", background: "#333", color: "#fff", border: "1px solid #555" }}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setReplyInputs({
                                    ...replyInputs,
                                    [q._id]: e.target.value,
                                  });
                                }
                              }}
                              value={""} // Always empty to allow re-selection
                            >
                              <option value="" disabled>✨ Select Auto-Reply...</option>
                              <option value="We sincerely apologize for the inconvenience. For the wrong product received, your return pickup has been scheduled. The order will be pickup in 3 days. Replacement will be sent post pickup.">Wrong Product Received (Pickup in 3 Days)</option>
                              <option value="We apologize that the scent did not meet your expectations. We have approved your return request. Please pack the item securely for pickup. Note: Return accepted as per 48h policy.">Not Satisfied (Return Approved)</option>
                              <option value="We are terribly sorry about the damaged bottle. We have initiated a full refund to your original payment method. As per our 24-hour promise, the amount will be credited within 24 hours.">Damaged / Leakage (Full Refund + 24h Promise)</option>
                              <option value="Your refund request is approved. Our finance team has initiated the transaction. You will receive the credit in your account within 24 business hours as per DEZA luxury standards.">Refund Approved (24-Hour Credit)</option>
                              <option value="Thank you for reaching out. Your exchange request for a different size/fragrance has been noted. Our team will contact you for pickup within 48 hours.">Exchange Request Acknowledgment</option>
                            </select>

                            <textarea
                              placeholder="Write reply..."
                              value={replyInputs[q._id] || ""}
                              onChange={(e) =>
                                setReplyInputs({
                                  ...replyInputs,
                                  [q._id]: e.target.value,
                                })
                              }
                              style={{ width: "100%", minHeight: "50px" }}
                            />
                            <button
                              className="small-btn edit-btn"
                              onClick={() => sendAdminReply(q._id)}
                              style={{ marginTop: "5px" }}
                            >
                              Send Reply 🚀
                            </button>
                            {q.refundStatus === "Initiated" || q.refundStatus === "Completed" ? (
                              <button
                                className="small-btn edit-btn"
                                disabled
                                style={{ marginTop: "5px", marginLeft: "5px", background: "#4caf50", border: "1px solid #388e3c", opacity: 0.8 }}
                              >
                                Refund Initiated ✅
                              </button>
                            ) : (
                              <button
                                className="small-btn edit-btn"
                                onClick={() => handleRefund(q._id)}
                                style={{ marginTop: "5px", marginLeft: "5px", background: "#f44336", border: "1px solid #d32f2f" }}
                              >
                                Initiate Refund 💸
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {queries.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        No support tickets found 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="admin-section">
            <h2>👥 Registered Customers</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customersOnly.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: "bold", color: "#D4AF37" }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.contact || "N/A"}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {customersOnly.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: "center" }}>No customers found yet 🛍️.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === "reviews" && (
          <div className="admin-section">
            <h2>⭐ Customer Reviews</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r._id}>
                      <td>{r.userName}</td>
                      <td>{products.find(p => p._id === r.productId)?.title || "Unknown"}</td>
                      <td style={{ color: "#D4AF37" }}>{"⭐".repeat(r.rating)}</td>
                      <td>{r.comment}</td>
                      <td>
                        <button className="small-btn delete-btn" onClick={async () => {
                          if (window.confirm("Delete review?")) {
                            await apiDeleteReview(r._id);
                            setReviews(reviews.filter(x => x._id !== r._id));
                            toast.success("Review deleted");
                          }
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {reviews.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: "center" }}>No reviews found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {activeTab === "categories" && (
          <div className="admin-section">
            <h2>🏷️ Product Categories</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesList.map((cat) => (
                    <tr key={cat._id}>
                      <td>{cat.name}</td>
                      <td>{cat.description || "N/A"}</td>
                      <td>{cat.active ? "✅ Active" : "❌ Inactive"}</td>
                    </tr>
                  ))}
                  {categoriesList.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: "center" }}>No categories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}







        {/* AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="admin-section">
            <h2>📜 System Audit Logs</h2>
            <div style={{
              background: "rgba(212, 175, 55, 0.05)",
              border: "1px solid rgba(212, 175, 55, 0.2)",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "13px",
              lineHeight: "1.5",
              color: "rgba(255,255,255,0.7)"
            }}>
              <strong>💡 Business Security:</strong> Audit Logs are a "digital paper trail." They record every admin action (like changing prices or marking orders) as they happen. This ensures your startup has full transparency and security as you scale. 💎
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Admin</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((l) => (
                    <tr key={l._id}>
                      <td>{new Date(l.createdAt).toLocaleString()}</td>
                      <td><span style={{ color: "#D4AF37" }}>{l.module}</span></td>
                      <td>{l.action}</td>
                      <td>{l.adminId?.name || "System"}</td>
                      <td style={{ fontSize: "12px" }}>{l.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: "center" }}>No logs recorded.</td></tr>
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
