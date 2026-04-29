import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Admin.css";
import toast from "react-hot-toast";
import { Filler } from "chart.js";
import { useNavigate } from "react-router-dom";
import {
  apiGetProducts, apiAddProduct, apiUpdateProduct, apiDeleteProduct, apiArchiveProduct, apiUnarchiveProduct,
  apiGetOrders, apiUpdateOrderStatus,
  apiGetQueries, apiUpdateQuery, apiReplyQuery, apiInitiateRefund,
  apiGetReviews, apiDeleteReview,
  apiGetUsers, apiDeleteUser,
  apiGetCategories, apiAddCategory, apiDeleteCategory, apiArchiveCategory, apiUnarchiveCategory,
  apiGetBrands, apiAddBrand, apiDeleteBrand, apiArchiveBrand, apiUnarchiveBrand,
  apiGetSubscribers, apiSendNewsletter,
  apiGetCoupons, apiAddCoupon,
  apiGetAuditLogs, apiGetHeroSettings
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
import AdminHeroEditor from "../components/AdminHeroEditor";

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

const REFRESH_INTERVAL = 10000; // 10s for production stability


// ❌ REMOVE THESE (these were making everything black)
// ChartJS.defaults.color = "#1A1A1A";
// ChartJS.defaults.borderColor = "#1A1A1A";

ChartJS.defaults.font.family = "Poppins";

export default function Admin() {
  const navigate = useNavigate();
  const dashboardRef = useRef();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Newsletter State
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);
  const [newsSubject, setNewsSubject] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Hardcoded UI labels (Optional fallback, but we use dynamic now)
  const categories = categoriesList.length ? categoriesList.map(c => c.name) : ["Men", "Women", "Unisex"];
  const types = brandsList.length ? brandsList.map(b => b.name) : ["Deza", "Recreational"];

  // ✅ PROFESSIONAL CHART OPTIONS (DARK THEME)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: "#fff",
          font: { family: 'Poppins', size: 16, weight: '800' },
          padding: 25,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        titleColor: "#D4AF37",
        bodyColor: "#fff",
        borderColor: "rgba(212, 175, 55, 0.4)",
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
        ticks: { color: "rgba(255, 255, 255, 0.9)", font: { size: 14, weight: '700' } },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
        ticks: { color: "rgba(255, 255, 255, 0.9)", font: { size: 14, weight: '700' } },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // ✅ Notification State (Persisted)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("admin_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const prevOrderIdsRef = useRef(new Set()); 
  const prevQueryIdsRef = useRef(new Set());
  const prevReturnIdsRef = useRef(new Set()); // Track notified returns
  const firstLoadRef = useRef(true);

  // Auto-save notifications
  useEffect(() => {
    localStorage.setItem("admin_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // ✅ Auto-scroll strictly to top when Admin tabs change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const content = document.querySelector('.admin-content');
    if (content) content.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  // ✅ Real-time Auto-Refresh (10s)
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
      // ✅ PERFORMANCE OPTIMIZATION: Only fetch real-time items on silent sync
      const criticalFetch = [
        apiGetOrders(),
        apiGetQueries(),
        apiGetUsers(),
      ];

      const fullFetch = silent ? [] : [
        apiGetProducts(true),
        apiGetReviews(),
        apiGetCategories(),
        apiGetBrands(),
        apiGetSubscribers(),
        apiGetCoupons(),
        apiGetAuditLogs(),
        apiGetHeroSettings(),
      ];

      // Handle Critical Fetch with error isolation
      let ords = [], qrys = [], usrs = [];
      try {
        const results = await Promise.all(criticalFetch);
        ords = results[0];
        qrys = results[1];
        usrs = results[2];
      } catch (critErr) {
        console.error("Critical Sync Error:", critErr);
        if (!silent) {
          setError(`Sync failed: ${critErr.message || "Network Error"}. Please check your connection or try again.`);
        }
        return;
      }

      const fullResults = silent ? [] : await Promise.all(fullFetch.map(p => p.catch(e => null)));

      console.log(`[⚡ Admin Sync] ${silent ? "Fast Sync" : "Full Sync"} at ${new Date().toLocaleTimeString()}`);

      // ✅ New Order Notification Logic (Robust ID set)
      if (ords.length > 0) {
        const newOrds = ords.filter(o => !prevOrderIdsRef.current.has(o._id));
        if (!firstLoadRef.current && newOrds.length > 0) {
          newOrds.forEach(o => {
            const orderId = o.orderId || `DZ-${String(o._id).slice(-6).toUpperCase()}`;
            setNotifications(prev => [{
              id: Date.now() + Math.random(),
              message: `🎉 New Order Received! (${orderId})`,
              time: new Date().toLocaleTimeString(),
              type: 'order'
            }, ...prev].slice(0, 30));
          });
          try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch (e) { }
        }
        ords.forEach(o => prevOrderIdsRef.current.add(o._id));
      }

      // ✅ New Query Notification Logic
      if (qrys.length > 0) {
        const newQrys = qrys.filter(q => !prevQueryIdsRef.current.has(q._id));
        if (!firstLoadRef.current && newQrys.length > 0) {
          newQrys.forEach(q => {
            setNotifications(prev => [{
              id: Date.now() + Math.random(),
              message: `📬 New Support Query! (${q.name})`,
              time: new Date().toLocaleTimeString(),
              type: 'query'
            }, ...prev].slice(0, 30));
          });
          try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch (e) { }
        }
        qrys.forEach(q => prevQueryIdsRef.current.add(q._id));
      }

      // ✅ NEW: Return & Refund Request Notification Logic
      const pendingReturns = ords.filter(o => 
        o.returnDetails?.status === "Pending" || 
        o.status === "Return Requested" ||
        o.refundStatus === "Refund Requested"
      );
      if (pendingReturns.length > 0) {
        const newReturns = pendingReturns.filter(o => !prevReturnIdsRef.current.has(o._id));
        if (!firstLoadRef.current && newReturns.length > 0) {
          newReturns.forEach(o => {
            const orderId = o.orderId || `DZ-${String(o._id).slice(-6).toUpperCase()}`;
            const typeLabel = o.refundStatus === "Refund Requested" ? "Refund" : "Return";
            setNotifications(prev => [{
              id: Date.now() + Math.random(),
              message: `↩️ ${typeLabel} Requested! (Order: ${orderId})`,
              time: new Date().toLocaleTimeString(),
              type: 'return'
            }, ...prev].slice(0, 30));
          });
          try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch (e) { }
        }
        pendingReturns.forEach(o => prevReturnIdsRef.current.add(o._id));
      }

      firstLoadRef.current = false;

      if (!silent) {
        const [prods, revs, cats, brnds, subs, cpns, logs, hro] = fullResults;
        if (prods) {
          const productData = Array.isArray(prods) ? prods : (prods.products || []);
          setProducts(productData);
        }
        if (revs) setReviews(revs);
        if (cats) setCategoriesList(cats);
        if (brnds) setBrandsList(brnds);
        if (subs) setSubscribers(subs);
        if (cpns) setCoupons(cpns);
        if (logs) setAuditLogs(logs);
      }

      setOrders(ords);
      setQueries(qrys);
      setUsers(usrs);

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Root Admin Load Error:", err);
      const msg = err.message || "";
      if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("403")) {
        toast.error("Session expired or unauthorized. Please login again.");
        setTimeout(() => {
          localStorage.removeItem("deza_token");
          localStorage.removeItem("deza_admin");
          window.location.href = "/admin-login";
        }, 2000);
      } else {
        setError(`Failed to connect to server (${msg}). Real-time sync might be interrupted.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Computed Sales Ticker (Live data)
  const recentSalesTicker = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
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
            reader.onloadend = () => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to WebP with 0.8 quality
                resolve(canvas.toDataURL("image/webp", 0.8));
              };
              img.src = reader.result;
            };
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

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (!newsSubject || !newsTitle || !newsBody) return toast.error("All fields required!");
    setSendingEmail(true);
    try {
      await apiSendNewsletter({ subject: newsSubject, title: newsTitle, body: newsBody });
      toast.success("Newsletter Broadcasted! 🚀");
      setNewsSubject(""); setNewsTitle(""); setNewsBody("");
      setShowNewsletterForm(false);
    } catch (e) {
      toast.error("Failed to send broadcast");
    } finally {
      setSendingEmail(false);
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

    if (Number(stock) <= 0) {
      toast.error("Stock must be greater than 0!");
      return;
    }

    const validSizePrices = sizePrices.filter(
      (sp) => sp.size.trim() !== "" && sp.price !== "",
    );

    if (!validSizePrices.length) {
      toast.error("Please add valid size-wise prices!");
      return;
    }

    const invalidPrice = validSizePrices.find((sp) => Number(sp.price) <= 0);
    if (invalidPrice) {
      toast.error("Price must be greater than 0!");
      return;
    }

    const invalidSize = validSizePrices.find((sp) => parseInt(sp.size) <= 0 || sp.size.trim() === "0" || sp.size.trim() === "0ml");
    if (invalidSize) {
      toast.error("Size cannot be 0 or negative!");
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
    if (!window.confirm("PERMANENTLY DELETE this product? This action cannot be undone!")) return;
    try {
      await apiDeleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
      toast.success("Product deleted permanently! 🗑️");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  // ARCHIVE PRODUCT
  const handleArchiveProduct = async (id) => {
    if (!window.confirm("Archive this product? It will be hidden from the shop.")) return;
    try {
      await apiArchiveProduct(id);
      // Update local state to reflect archived status
      setProducts(products.map((p) => (p._id === id ? { ...p, isArchived: true } : p)));
      toast.success("Product archived successfully!");
    } catch (err) {
      toast.error("Failed to archive: " + err.message);
    }
  };

  // UNARCHIVE PRODUCT
  const handleUnarchiveProduct = async (id) => {
    if (!window.confirm("Restore this product to the shop?")) return;
    try {
      await apiUnarchiveProduct(id);
      // Update local state to reflect unarchived status
      setProducts(products.map((p) => (p._id === id ? { ...p, isArchived: false } : p)));
      toast.success("Product restored successfully!");
    } catch (err) {
      toast.error("Failed to restore: " + err.message);
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

    if (Number(stock) <= 0) {
      toast.error("Stock must be greater than 0!");
      return;
    }

    const validSizePrices = sizePrices.filter(
      (sp) => sp.size.trim() !== "" && sp.price !== "",
    );

    if (!validSizePrices.length) {
      toast.error("Please add valid size-wise prices!");
      return;
    }

    const invalidPrice = validSizePrices.find((sp) => Number(sp.price) <= 0);
    if (invalidPrice) {
      toast.error("Price must be greater than 0!");
      return;
    }

    const invalidSize = validSizePrices.find((sp) => parseInt(sp.size) <= 0 || sp.size.trim() === "0" || sp.size.trim() === "0ml");
    if (invalidSize) {
      toast.error("Size cannot be 0 or negative!");
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
  const updateOrderStatus = async (id, status, comment, trackingNumber, deliveryCompany) => {
    try {
      const updated = await apiUpdateOrderStatus(id, status, comment, trackingNumber, deliveryCompany);
      setOrders(orders.map((o) => (o._id === id ? { ...o, ...updated } : o)));
      if (trackingNumber) toast.success("Tracking information updated! 📦");
      else toast.success(`Order status updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update: " + err.message);
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

  const [refundingIds, setRefundingIds] = useState(new Set());

  const handleRefund = async (id) => {
    if (!window.confirm("Are you sure you want to INITIATE a full refund via Razorpay? This cannot be undone.")) return;

    // Visual feedback
    setRefundingIds(prev => new Set(prev).add(id));
    
    try {
      console.log("🚀 Initiating refund for ticket:", id);
      const response = await apiInitiateRefund(id);
      
      const updatedTicket = response.ticket || response.query;
      if (updatedTicket) {
        setQueries(queries.map((q) => (q._id === id ? { ...q, ...updatedTicket } : q)));
      }
      
      toast.success("Refund Processed Successfully! ✨");
      window.alert("✅ Refund Successful!\nRazorpay ID: " + (updatedTicket?.razorpayRefundId || "Success"));
      
      setTimeout(() => {
        loadAll(true);
      }, 1000);
    } catch (err) {
      console.error("❌ Refund error:", err);
      toast.error("Refund Failed: " + (err.message || "Unknown error"));
      window.alert("❌ Refund Failed!\nReason: " + (err.message || "Check console for details"));
    } finally {
      setRefundingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

  const finalOrders = filteredOrders; // Orders shouldn't be filtered by product-categories at top level

  // Stats
  const totalProducts = products.length;
  const totalOrders = finalOrders.length;

  const totalRefunded = finalOrders.reduce((acc, o) => {
    if (o.refundStatus === "Completed" || o.status === "Returned") {
      return acc + (o.totalPrice || 0);
    }
    return acc;
  }, 0);

  const totalRevenue = finalOrders.reduce(
    (acc, o) => {
      if (o.status === "Cancelled" || o.status === "Returned" || o.refundStatus === "Completed") return acc;
      return acc + (o.totalPrice || 0);
    },
    0,
  );

  const deliveredOrders = finalOrders.filter(
    (o) => o.status === "Delivered",
  ).length;

  const pendingOrders = finalOrders.filter(
    (o) => o.status === "Pending" || o.status === "Processing",
  ).length;

  const shippedOrders = finalOrders.filter(
    (o) => o.status === "Shipped" || o.status === "Out for Delivery",
  ).length;

  const whatsappRevenue = finalOrders
    .filter(o => o.orderSource === "WhatsApp" && o.status !== "Cancelled" && o.status !== "Returned" && o.refundStatus !== "Completed")
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  // ✅ New Time-based totals for Top Card
  const now = new Date();
  const dailyTotalRev = orders.filter(o => 
    new Date(o.createdAt || o.date).toDateString() === now.toDateString() && 
    o.status !== "Cancelled" && o.status !== "Returned" && o.refundStatus !== "Completed"
  ).reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const weeklyTotalRev = orders.filter(o => {
    const d = new Date(o.createdAt || o.date);
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo && o.status !== "Cancelled" && o.status !== "Returned" && o.refundStatus !== "Completed";
  }).reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const monthlyTotalRev = orders.filter(o => {
    const d = new Date(o.createdAt || o.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && 
           o.status !== "Cancelled" && o.status !== "Returned" && o.refundStatus !== "Completed";
  }).reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const yearlyTotalRev = orders.filter(o => {
    const d = new Date(o.createdAt || o.date);
    return d.getFullYear() === now.getFullYear() && o.status !== "Cancelled" && 
           o.status !== "Returned" && o.refundStatus !== "Completed";
  }).reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // Filter Products for the List Tab
  const productsToDisplay = products.filter((p) => {
    const catMatch = filterCategory === "All" || 
      (p.categories || []).some(c => c.toLowerCase() === filterCategory.toLowerCase());
    const typeMatch = filterType === "All" || 
      (p.types || []).some(t => t.toLowerCase() === filterType.toLowerCase());
    return catMatch && typeMatch;
  });

  // Ratings (Calculated for filtered products)
  const productsWithAvgRating = productsToDisplay.map((p) => {
    const productReviews = reviews.filter((r) => r.productId === p._id);
    const avgRating = productReviews.length
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
      productReviews.length
      : (p.rating || 0);
    return { ...p, avgRating };
  });
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

  const highestRatedProduct = productsWithAvgRating.reduce(
    (max, p) => (p.avgRating > max.avgRating ? p : max),
    { avgRating: 0, title: "No Products" },
  );

  // Charts
  // ✅ Aggregated Revenue Data (Grouped by Date)
  const revenueByDate = finalOrders.reduce((acc, o) => {
    const dateStr = new Date(o.createdAt || o.date).toLocaleDateString();
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
        borderWidth: 5,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: "#D4AF37",
        pointBorderColor: "#000",
        fill: true,
      },
    ],
  };

  const categoryChart = useMemo(() => ({
    labels: categories,
    datasets: [
      {
        label: "Products by Category",
        data: categories.map((c) => 
          products.filter((p) => 
            (p.categories || []).some(cat => cat.toLowerCase() === c.toLowerCase()) ||
            (p.category?.name?.toLowerCase() === c.toLowerCase())
          ).length
        ),
        backgroundColor: ["#D4AF37", "#9B8477", "#F9F7F2", "#4F4F4F", "#000"],
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 2,
      },
    ],
  }), [categories, products]);

  const typeChart = useMemo(() => ({
    labels: types,
    datasets: [
      {
        label: "Products by Brand",
        data: types.map((t) => 
          products.filter((p) => 
            (p.types || []).some(type => type.toLowerCase() === t.toLowerCase()) ||
            (p.brand?.name?.toLowerCase() === t.toLowerCase())
          ).length
        ),
        backgroundColor: ["#D4AF37", "#F9F7F2", "#9B8477", "#333"],
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  }), [types, products]);

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

  const printInvoice = (order) => {
    const doc = new jsPDF();
    const orderId = order.orderId || `DZ-${String(order._id).slice(-6).toUpperCase()}`;
    
    // Header
    doc.setFillColor(26, 26, 26); // Dark background
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setFontSize(28);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text("DEZA LUXURY", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Premium Fragrances & Boutique Experience", 105, 28, { align: "center" });

    // Invoice Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("TAX INVOICE", 10, 55);
    
    doc.setFontSize(10);
    doc.text(`Invoice No: INV-${orderId}`, 10, 65);
    doc.text(`Order Date: ${new Date(order.createdAt || order.date).toLocaleDateString()}`, 10, 70);
    doc.text(`Payment: ${order.paymentMethod || "COD"}`, 10, 75);

    // Billed To
    doc.setFontSize(12);
    doc.text("Billed To:", 130, 55);
    doc.setFontSize(10);
    const addr = order.shippingAddress || order.address || {};
    doc.text(order.customerName || "Customer", 130, 62);
    doc.text(order.customerEmail || "N/A", 130, 67);
    doc.text(order.customerPhone || "N/A", 130, 72);
    doc.text(`${addr.street || ""}, ${addr.city || ""}`, 130, 77);
    doc.text(`${addr.state || ""} - ${addr.pincode || ""}`, 130, 82);
    
    // Items Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(10, 95, 190, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Item", 15, 101);
    doc.text("Size", 100, 101);
    doc.text("Qty", 130, 101);
    doc.text("Price", 150, 101);
    doc.text("Total", 180, 101);
    
    // Items Table Body
    doc.setFont("helvetica", "normal");
    let y = 110;
    let subtotal = 0;
    (order.items || []).forEach((item) => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      doc.text(item.name || "Fragrance", 15, y);
      doc.text(item.selectedSize || "N/A", 100, y);
      doc.text(String(item.qty), 130, y);
      doc.text(`INR ${item.price.toLocaleString()}`, 150, y);
      doc.text(`INR ${itemTotal.toLocaleString()}`, 180, y);
      y += 8;
    });

    // Summary Section
    y += 10;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(130, y, 200, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.text("Product Price:", 130, y);
    doc.text(`INR ${subtotal.toLocaleString()}`, 180, y);
    
    y += 7;
    doc.text("Shipping Fee:", 130, y);
    doc.text(`INR ${(order.shippingFee || 0).toLocaleString()}`, 180, y);

    if (order.handlingFee > 0) {
      y += 7;
      doc.text("Platform Handling Fee:", 130, y);
      doc.text(`INR ${order.handlingFee.toLocaleString()}`, 180, y);
    }

    if (order.codFee > 0) {
      y += 7;
      doc.text("COD Fee:", 130, y);
      doc.text(`INR ${order.codFee.toLocaleString()}`, 180, y);
    }

    y += 10;
    doc.setFillColor(212, 175, 55);
    doc.rect(130, y - 5, 70, 8, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 132, y);
    doc.text(`INR ${order.totalAmount.toLocaleString()}`, 180, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer generated invoice. No signature required.", 105, 280, { align: "center" });
    doc.text("Thank you for choosing DEZA. Your signature scent awaits.", 105, 285, { align: "center" });
    
    doc.save(`DEZA_Invoice_${orderId}.pdf`);
  };


  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deza_token");
    toast.success("Admin logged out! 👋");
    navigate("/");
  };

  return (
    <div className={`admin-page ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {/* MOBILE HEADER */}
      <div className="admin-mobile-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? "✕" : "☰"}
        </button>
        <h2 className="mobile-logo">DEZA ADMIN</h2>
        <div className="header-actions">
          <button className="notification-btn-mobile">🔔</button>
        </div>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <div className={`admin-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header-desktop">
          <h2 className="admin-logo">DEZA Admin</h2>
        </div>

        <div className="sidebar-menu-scroll">
          <SidebarBtn
            icon="📊"
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="➕"
            label="Add Product"
            active={activeTab === "add"}
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
              setIsSidebarOpen(false);
            }}
          />

          <SidebarBtn
            icon="🛍"
            label="Product List"
            active={activeTab === "list"}
            onClick={() => { setActiveTab("list"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="📦"
            label="Orders"
            active={activeTab === "orders"}
            onClick={() => { setActiveTab("orders"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="💬"
            label="Support"
            active={activeTab === "support"}
            onClick={() => { setActiveTab("support"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="👥"
            label="Users"
            active={activeTab === "users"}
            onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="⭐"
            label="Reviews"
            active={activeTab === "reviews"}
            onClick={() => { setActiveTab("reviews"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="📜"
            label="Audit Logs"
            active={activeTab === "audit"}
            onClick={() => { setActiveTab("audit"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="🏷️"
            label="Categories"
            active={activeTab === "categories"}
            onClick={() => { setActiveTab("categories"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="✨"
            label="Brands"
            active={activeTab === "brands"}
            onClick={() => { setActiveTab("brands"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="📧"
            label="Subscribers"
            active={activeTab === "subscribers"}
            onClick={() => { setActiveTab("subscribers"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="🎟️"
            label="Coupons"
            active={activeTab === "coupons"}
            onClick={() => { setActiveTab("coupons"); setIsSidebarOpen(false); }}
          />

          <SidebarBtn
            icon="🏠"
            label="Hero Settings"
            active={activeTab === "hero"}
            onClick={() => { setActiveTab("hero"); setIsSidebarOpen(false); }}
          />

          <div className="sidebar-divider"></div>

          <SidebarBtn
            icon="👋"
            label="Logout"
            className="logout-btn"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        {error && (
          <div className="admin-error">
            <h2>{error} ❌</h2>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
              <button className="lux-btn" onClick={() => loadAll()}>Retry</button>
              <button className="lux-btn danger" onClick={() => { localStorage.clear(); window.location.reload(); }}>Clear Cache</button>
            </div>
          </div>
        )}

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

            {/* ENHANCED: 4-WAY SALES PERFORMANCE OVERVIEW */}
            <div className="admin-section" style={{ 
              background: 'linear-gradient(135deg, #1e1e22, #0b0b0d)', 
              marginBottom: '30px', 
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
              padding: '30px',
              borderRadius: '15px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', alignItems: 'center' }}>
                <div style={{ borderRight: '1px solid rgba(212,175,55,0.1)', paddingRight: '15px' }}>
                  <span style={{ fontSize: '10px', color: '#d4af37', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Revenue (Net)</span>
                  <h2 style={{ fontSize: '32px', color: reportPeriod === 'daily' ? '#d4af37' : '#fff', margin: '5px 0', fontWeight: '900' }}>₹{dailyTotalRev.toLocaleString()}</h2>
                  {reportPeriod === 'daily' && <small style={{ color: '#d4af37', fontSize: '10px' }}>● Selected Period</small>}
                </div>
                <div style={{ borderRight: '1px solid rgba(212,175,55,0.1)', paddingRight: '15px' }}>
                  <span style={{ fontSize: '10px', color: '#d4af37', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Revenue (Net)</span>
                  <h2 style={{ fontSize: '32px', color: reportPeriod === 'weekly' ? '#d4af37' : '#fff', margin: '5px 0', fontWeight: '900' }}>₹{weeklyTotalRev.toLocaleString()}</h2>
                  {reportPeriod === 'weekly' && <small style={{ color: '#d4af37', fontSize: '10px' }}>● Selected Period</small>}
                </div>
                <div style={{ borderRight: '1px solid rgba(212,175,55,0.1)', paddingRight: '15px' }}>
                  <span style={{ fontSize: '10px', color: '#d4af37', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Revenue (Net)</span>
                  <h2 style={{ fontSize: '32px', color: reportPeriod === 'monthly' ? '#d4af37' : '#fff', margin: '5px 0', fontWeight: '900' }}>₹{monthlyTotalRev.toLocaleString()}</h2>
                  {reportPeriod === 'monthly' && <small style={{ color: '#d4af37', fontSize: '10px' }}>● Selected Period</small>}
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#d4af37', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Yearly Revenue (Net)</span>
                  <h2 style={{ fontSize: '32px', color: reportPeriod === 'yearly' || reportPeriod === 'all' ? '#d4af37' : '#fff', margin: '5px 0', fontWeight: '900' }}>₹{yearlyTotalRev.toLocaleString()}</h2>
                  {(reportPeriod === 'yearly' || reportPeriod === 'all') && <small style={{ color: '#d4af37', fontSize: '10px' }}>● Selected Period</small>}
                </div>
              </div>
            </div>

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
                <div className="card-icon">📈</div>
                <div className="card-content">
                  <h3>Gross Sales</h3>
                  <p>₹{(totalRevenue + totalRefunded).toLocaleString()}</p>
                  <small style={{ opacity: 0.7, fontSize: '10px' }}>Total amount received</small>
                </div>
              </div>

              <div className="admin-card myntra-card red" style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)' }}>
                <div className="card-icon">↩️</div>
                <div className="card-content">
                  <h3 style={{ color: '#e74c3c' }}>Total Refunded</h3>
                  <p style={{ color: '#e74c3c' }}>₹{totalRefunded.toLocaleString()}</p>
                  <small style={{ color: '#e74c3c', opacity: 0.7, fontSize: '10px' }}>Money sent back</small>
                </div>
              </div>

              <div className="admin-card myntra-card gold" style={{ background: 'linear-gradient(135deg, #d4af37, #aa8822)', border: '1px solid #d4af37' }}>
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3 style={{ color: '#fff' }}>Net Revenue</h3>
                  <p style={{ color: '#fff', fontWeight: '900' }}>₹{totalRevenue.toLocaleString()}</p>
                  <small style={{ color: '#fff', opacity: 0.8, fontSize: '10px' }}>Actual Profit (Gross - Refunded)</small>
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


              {/* WHATSAPP REVENUE CARD */}
              <div className="admin-card myntra-card" style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
                <div className="card-icon">💬</div>
                <div className="card-content">
                  <h3>WhatsApp Sales</h3>
                  <p>₹{whatsappRevenue.toLocaleString()}</p>
                  <small style={{ display: "block", opacity: 0.8, fontSize: "11px", marginTop: "5px" }}>
                    Tracked via WhatsApp Button
                  </small>
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS & ACTIVITY */}
            <div className="dashboard-grid-2">
              <div className="activity-panel">
                <div className="flex-between">
                  <h3>🔔 Recent Notifications</h3>
                  <button
                    className="small-btn delete-btn"
                    style={{ fontSize: '10px', padding: '4px 8px' }}
                    onClick={() => setNotifications([])}
                  >
                    Clear All
                  </button>
                </div>
                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className={`notify-item ${n.type || ""}`}>
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

            {/* REVENUE TREND - SCROLLABLE FOR DATES */}
            <div className="chart-box" style={{ width: '100%', marginBottom: '30px', overflow: 'hidden', padding: '0', background: '#0b0b0d', minHeight: 'auto' }}>
              <h3 style={{ padding: '20px 20px 0 20px', borderBottom: 'none' }}>📊 Sales Velocity & Momentum (Slide ↔️)</h3>
              <div className="charts-scroll-container" style={{ overflowX: 'scroll', overflowY: 'hidden', cursor: 'grab', width: '100%' }}>
                <div style={{ minWidth: `${(revenueLabels.length / 7) * 100}%`, height: '400px', marginBottom: '-10px' }}>
                  <Line 
                    data={revenueChart} 
                    options={{ 
                      ...chartOptions, 
                      maintainAspectRatio: false,
                      layout: {
                        padding: {
                          bottom: 0,
                          left: 0,
                          right: 0
                        }
                      },
                      scales: {
                        ...chartOptions.scales,
                        x: { 
                          ...chartOptions.scales.x, 
                          grid: { display: false },
                          ticks: { ...chartOptions.scales.x.ticks, padding: 0 }
                        },
                        y: {
                          ...chartOptions.scales.y,
                          display: true,
                          grid: { color: 'rgba(255,255,255,0.03)' },
                          ticks: { ...chartOptions.scales.y.ticks, padding: 10 }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* OTHER CHARTS - RESPONSIVE GRID */}
            <div className="charts-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
              gap: '30px',
              width: '100%'
            }}>
              <div className="chart-box" style={{ width: '100%', padding: '0', background: '#0b0b0d', overflow: 'hidden', height: '480px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ padding: '20px 20px 0 20px', borderBottom: 'none', margin: '0' }}>Products by Category</h3>
                <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                  <Pie 
                    data={categoryChart} 
                    options={{ 
                      ...chartOptions, 
                      maintainAspectRatio: false,
                      layout: { padding: 10 },
                      plugins: { 
                        ...chartOptions.plugins, 
                        legend: { ...chartOptions.plugins.legend, position: 'bottom', labels: { ...chartOptions.plugins.legend.labels, padding: 15 } } 
                      } 
                    }} 
                  />
                </div>
              </div>

              <div className="chart-box" style={{ width: '100%', padding: '0', background: '#0b0b0d', overflow: 'hidden', height: '480px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ padding: '20px 20px 0 20px', borderBottom: 'none', margin: '0' }}>Products by Brand</h3>
                <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                  <Bar 
                    data={typeChart} 
                    options={{ 
                      ...chartOptions, 
                      maintainAspectRatio: false,
                      layout: { padding: 20 },
                      scales: {
                        ...chartOptions.scales,
                        x: { 
                          ...chartOptions.scales.x, 
                          grid: { display: false },
                          ticks: { ...chartOptions.scales.x.ticks, padding: 10 } 
                        },
                        y: {
                          ...chartOptions.scales.y,
                          ticks: { ...chartOptions.scales.y.ticks, padding: 10 }
                        }
                      }
                    }} 
                  />
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
                <div className="checkbox-row" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {categories.map((c) => (
                    <label key={c} className="check-item" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={categoriesSelected.includes(c)}
                        onChange={() => {
                          if (categoriesSelected.includes(c)) {
                            setCategoriesSelected(categoriesSelected.filter(x => x !== c));
                          } else {
                            setCategoriesSelected([...categoriesSelected, c]);
                          }
                        }}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="checkbox-group" style={{ marginTop: "15px" }}>
                <h4>✨ Brands (Select Brand)</h4>
                <div className="checkbox-row" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {types.map((t) => (
                    <label key={t} className="check-item" style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={typesSelected.includes(t)}
                        onChange={() => {
                          if (typesSelected.includes(t)) {
                            setTypesSelected(typesSelected.filter(x => x !== t));
                          } else {
                            setTypesSelected([...typesSelected, t]);
                          }
                        }}
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
                      <td>
                        {p.title}
                        {p.isArchived && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '10px',
                            background: '#ff4d4d',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Archived
                          </span>
                        )}
                      </td>
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

                        {p.isArchived ? (
                          <button
                            className="small-btn unarchive-btn"
                            onClick={() => handleUnarchiveProduct(p._id)}
                          >
                            Unarchive
                          </button>
                        ) : (
                          <button
                            className="small-btn archive-btn"
                            onClick={() => handleArchiveProduct(p._id)}
                          >
                            Archive
                          </button>
                        )}
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
                    <th>Source</th>
                    <th>Payment</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>

                <tbody>
                  {finalOrders.map((o) => (
                    <tr key={o._id}>
                      <td>{o.orderId || o.orderNumber || "DZ-" + String(o._id).slice(-6).toUpperCase()}</td>
                      <td>
                        {new Date(o.createdAt || o.date).toLocaleDateString()} <br />
                        <small style={{ opacity: 0.6 }}>{new Date(o.createdAt || o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </td>

                      <td>
                        <strong>{o.customerName || "N/A"}</strong>
                        <br />
                        {o.customerEmail || ""}
                      </td>

                      <td>
                        {o.shippingAddress || o.address ? (
                          typeof (o.shippingAddress || o.address) === "string" ? (
                            <>{o.shippingAddress || o.address}</>
                          ) : (
                            <>
                              <strong>{o.customerName}</strong> <br />
                              {o.customerPhone} <br />
                              {(o.shippingAddress || o.address).street}, {(o.shippingAddress || o.address).area} <br />
                              {(o.shippingAddress || o.address).city}, {(o.shippingAddress || o.address).state} -{" "}
                              {(o.shippingAddress || o.address).pincode} <br />
                              {(o.shippingAddress || o.address).country}
                            </>
                          )
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '10px', 
                          fontWeight: '800',
                          background: o.orderSource === "WhatsApp" ? "#25D366" : "rgba(212,175,55,0.1)",
                          color: o.orderSource === "WhatsApp" ? "#000" : "#D4AF37",
                          textTransform: 'uppercase'
                        }}>
                          {o.orderSource || "Website"}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '10px', 
                          fontWeight: '800',
                          background: 'rgba(212,175,55,0.05)',
                          color: '#D4AF37',
                          border: '1px solid rgba(212,175,55,0.2)'
                        }}>
                          {o.paymentMethod || "COD"}
                        </span>
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

                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <span style={{ opacity: 0.6 }}>Product:</span>
                            <span>₹{(o.totalPrice - (o.shippingFee || 0) - (o.handlingFee || 0) - (o.codFee || 0)).toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <span style={{ opacity: 0.6 }}>Shipping:</span>
                            <span>₹{(o.shippingFee || 0).toLocaleString()}</span>
                          </div>
                          {o.handlingFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                              <span style={{ opacity: 0.6 }}>Handling:</span>
                              <span>₹{o.handlingFee.toLocaleString()}</span>
                            </div>
                          )}
                          {o.codFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                              <span style={{ opacity: 0.6 }}>COD Fee:</span>
                              <span>₹{o.codFee.toLocaleString()}</span>
                            </div>
                          )}
                          <div style={{ borderTop: '1px solid #444', marginTop: '5px', paddingTop: '5px', fontWeight: 'bold', fontSize: '14px', color: '#D4AF37' }}>
                            ₹{o.totalPrice.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            background: o.status === "Delivered" ? "#2ecc71" : o.status === "Cancelled" ? "#e74c3c" : "#333",
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {o.status}
                          </span>
                          {o.returnDetails?.status === "Pending" && (
                            <span style={{ background: "#f39c12", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "900" }}>
                              ↩ RETURN REQ
                            </span>
                          )}
                          {o.refundStatus === "Refund Requested" && (
                            <span style={{ background: "#e74c3c", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "900" }}>
                              💸 REFUND REQ
                            </span>
                          )}
                          {o.refundStatus === "Completed" && (
                            <span style={{ background: "#2ecc71", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "900" }}>
                              ✅ REFUNDED
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={o.status}
                          style={{
                            background: o.status === "Delivered" ? "#2ecc71" : o.status === "Cancelled" ? "#e74c3c" : "#333",
                            color: "#fff",
                            padding: "5px",
                            borderRadius: "8px",
                            border: "1px solid #555"
                          }}
                          onChange={(e) =>
                            updateOrderStatus(o._id, e.target.value)
                          }
                        >
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="Returned">Returned</option>
                        </select>

                        <div style={{ marginTop: "10px", display: "flex", gap: "5px" }}>
                          <button
                            onClick={async () => {
                              try {
                                const res = await apiToggleLiveTracking(o._id);
                                toast.success(res.message);
                                loadAll(true);
                              } catch (e) { toast.error("Failed to toggle tracking"); }
                            }}
                            style={{
                              padding: "4px 8px",
                              fontSize: "10px",
                              borderRadius: "6px",
                              background: o.liveTracking?.isActive ? "#50c878" : "#333",
                              color: "#fff",
                              border: "1px solid #555",
                              cursor: "pointer"
                            }}
                          >
                            {o.liveTracking?.isActive ? "📡 Live" : "🛰️ GO LIVE"}
                          </button>
                          
                          {o.liveTracking?.isActive && (
                            <button
                              onClick={async () => {
                                // Simulate random movement around current point or the origin shop
                                const fallBackLat = o.shopId?.location?.lat || 19.1726;
                                const fallBackLng = o.shopId?.location?.lng || 72.9425;
                                const newLat = (o.liveTracking?.lat || fallBackLat) + (Math.random() - 0.5) * 0.01;
                                const newLng = (o.liveTracking?.lng || fallBackLng) + (Math.random() - 0.5) * 0.01;
                                try {
                                  await apiToggleLiveTracking(o._id, true, newLat, newLng);
                                  toast.success("Driver Position Updated");
                                  loadAll(true);
                                } catch (e) { }
                              }}
                              style={{ padding: "4px 8px", fontSize: "10px", borderRadius: "6px", background: "#d4af37", color: "#000", border: "none", cursor: "pointer" }}
                            >
                              Move 🚛
                            </button>
                          )}
                        </div>

                        {o.status === "Shipped" && (
                          <div style={{ marginTop: "10px" }}>
                            <input
                              type="text"
                              placeholder="Tracking ID"
                              defaultValue={o.trackingNumber}
                              onBlur={(e) => updateOrderStatus(o._id, "Shipped", "Tracking Updated", e.target.value)}
                              style={{ padding: "4px", fontSize: "11px", width: "100px", background: "#222", color: "#fff", border: "1px solid #444" }}
                            />
                          </div>
                        )}

                        <button
                          onClick={() => printInvoice(o)}
                          style={{
                            marginTop: "10px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            borderRadius: "6px",
                            background: "rgba(212, 175, 55, 0.1)",
                            color: "#d4af37",
                            border: "1px solid #d4af37",
                            cursor: "pointer",
                            width: "100%",
                            fontWeight: "bold"
                          }}
                        >
                          Print Invoice 📄
                        </button>
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
                      <td>
                        <span className="badge-premium" style={{ 
                          background: q.ticketType === "Return / Refund" ? "rgba(231, 76, 60, 0.2)" : "rgba(212, 175, 55, 0.1)",
                          color: q.ticketType === "Return / Refund" ? "#e74c3c" : "#d4af37",
                          border: q.ticketType === "Return / Refund" ? "1px solid rgba(231, 76, 60, 0.4)" : "1px solid rgba(212, 175, 55, 0.3)"
                        }}>
                          {q.ticketType}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: q.issueType?.includes("Refund") ? "#e74c3c" : "#d4af37",
                          fontWeight: q.issueType?.includes("Refund") ? "900" : "600"
                        }}>
                          {q.issueType}
                        </span>
                      </td>
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
                              <option value="" disabled>✨ Select Reply Template...</option>
                              <option value="We sincerely apologize for the inconvenience. For the wrong product received, your return pickup has been scheduled. The order will be pickup in 3 days. Replacement will be sent post pickup.">Reply Template: Wrong Item (3-Day Pickup)</option>
                              <option value="We apologize that the scent did not meet your expectations. We have approved your return request. Please pack the item securely for pickup. Note: Return accepted as per 48h policy.">Reply Template: Scent Return Approved (48h)</option>
                              <option value="We are terribly sorry about the damaged bottle. We have initiated a full refund to your original payment method. As per our 24-hour promise, the amount will be credited within 24 hours.">Reply Template: Damaged Bottle (Full Refund)</option>
                              <option value="Your refund request is approved. Our finance team has initiated the transaction. You will receive the credit in your account within 24 business hours as per DEZA luxury standards.">Reply Template: Refund Approved (Initate Transfer)</option>
                              <option value="Thank you for reaching out. Your exchange request for a different size/fragrance has been noted. Our team will contact you for pickup within 48 hours.">Reply Template: Exchange Acknowledged</option>
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
                      <td>{products.find(p => String(p._id) === String(r.productId))?.title || "Unknown"}</td>
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
            <div className="flex-between">
              <h2>🏷️ Product Categories</h2>
              <button className="small-btn edit-btn" onClick={async () => {
                const name = prompt("Enter Category Name:");
                if (!name) return;
                try {
                  await apiAddCategory({ name, active: true });
                  toast.success("Category Added! 🪄");
                  loadAll();
                } catch (e) { toast.error("Failed to add category"); }
              }}>+ Add New Category</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesList.map((cat) => (
                    <tr key={cat._id}>
                      <td style={{ fontWeight: "600" }}>{cat.name}</td>
                      <td>
                        <span style={{
                          color: cat.active ? "#4CAF50" : "#f44336",
                          fontWeight: "600"
                        }}>
                          {cat.active ? "✅ Active" : "📦 Archived"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {cat.active ? (
                            <button
                              className="small-btn"
                              style={{ background: "#f39c12", border: "1px solid #e67e22", color: "#fff" }}
                              onClick={async () => {
                                if (!window.confirm(`Archive "${cat.name}"? It will be hidden from product selection.`)) return;
                                try {
                                  await apiArchiveCategory(cat._id);
                                  setCategoriesList(categoriesList.map(c => c._id === cat._id ? { ...c, active: false } : c));
                                  toast.success(`"${cat.name}" archived 📦`);
                                } catch (e) { toast.error("Failed to archive category"); }
                              }}
                            >📦 Archive</button>
                          ) : (
                            <button
                              className="small-btn edit-btn"
                              onClick={async () => {
                                if (!window.confirm(`Restore "${cat.name}" to active?`)) return;
                                try {
                                  await apiUnarchiveCategory(cat._id);
                                  setCategoriesList(categoriesList.map(c => c._id === cat._id ? { ...c, active: true } : c));
                                  toast.success(`"${cat.name}" restored ✅`);
                                } catch (e) { toast.error("Failed to restore category"); }
                              }}
                            >✅ Restore</button>
                          )}
                          <button
                            className="small-btn delete-btn"
                            onClick={async () => {
                              if (!window.confirm(`PERMANENTLY DELETE "${cat.name}"? This cannot be undone!`)) return;
                              try {
                                await apiDeleteCategory(cat._id);
                                setCategoriesList(categoriesList.filter(c => c._id !== cat._id));
                                toast.success(`"${cat.name}" deleted permanently 🗑️`);
                              } catch (e) { toast.error("Failed to delete category"); }
                            }}
                          >🗑️ Delete</button>
                        </div>
                      </td>
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

        {/* BRANDS */}
        {activeTab === "brands" && (
          <div className="admin-section">
            <div className="flex-between">
              <h2>✨ Luxury Fragrance Brands</h2>
              <button className="small-btn edit-btn" onClick={async () => {
                const name = prompt("Enter Brand Name:");
                const origin = prompt("Enter Origin (e.g. France, India):");
                if (!name) return;
                try {
                  await apiAddBrand({ name, origin });
                  toast.success("Brand Registered! ✨");
                  loadAll();
                } catch (e) { toast.error("Failed to register brand"); }
              }}>+ Add New Brand</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Brand Name</th>
                    <th>Origin</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brandsList.map((b) => (
                    <tr key={b._id}>
                      <td style={{ fontWeight: "800", color: "#D4AF37" }}>{b.name}</td>
                      <td>{b.origin || "International"}</td>
                      <td>{products.filter(p => p.types?.includes(b.name)).length} Products</td>
                      <td>
                        <span style={{
                          color: b.isActive !== false ? "#4CAF50" : "#f44336",
                          fontWeight: "600"
                        }}>
                          {b.isActive !== false ? "✅ Active" : "📦 Archived"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {b.isActive !== false ? (
                            <button
                              className="small-btn"
                              style={{ background: "#f39c12", border: "1px solid #e67e22", color: "#fff" }}
                              onClick={async () => {
                                if (!window.confirm(`Archive brand "${b.name}"? It will be hidden from product selection.`)) return;
                                try {
                                  await apiArchiveBrand(b._id);
                                  setBrandsList(brandsList.map(br => br._id === b._id ? { ...br, isActive: false } : br));
                                  toast.success(`"${b.name}" archived 📦`);
                                } catch (e) { toast.error("Failed to archive brand"); }
                              }}
                            >📦 Archive</button>
                          ) : (
                            <button
                              className="small-btn edit-btn"
                              onClick={async () => {
                                if (!window.confirm(`Restore brand "${b.name}" to active?`)) return;
                                try {
                                  await apiUnarchiveBrand(b._id);
                                  setBrandsList(brandsList.map(br => br._id === b._id ? { ...br, isActive: true } : br));
                                  toast.success(`"${b.name}" restored ✅`);
                                } catch (e) { toast.error("Failed to restore brand"); }
                              }}
                            >✅ Restore</button>
                          )}
                          <button
                            className="small-btn delete-btn"
                            onClick={async () => {
                              if (!window.confirm(`PERMANENTLY DELETE brand "${b.name}"? This cannot be undone!`)) return;
                              try {
                                await apiDeleteBrand(b._id);
                                setBrandsList(brandsList.filter(br => br._id !== b._id));
                                toast.success(`"${b.name}" deleted permanently 🗑️`);
                              } catch (e) { toast.error("Failed to delete brand"); }
                            }}
                          >🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brandsList.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: "center" }}>No brands registered.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUPPORT TICKETS */}
        {activeTab === "queries" && (
          <div className="admin-section">
            <div className="flex-between" style={{ marginBottom: "20px" }}>
              <div className="admin-header-flex">
                <div>
                  <h2 className="admin-title">📬 Support Tickets</h2>
                  <p className="admin-subtitle">Customer queries, return requests, and refund appeals.</p>
                </div>
              </div>
              <div className="action-buttons">
                <button 
                  className="small-btn" 
                  style={{ background: "#333", color: "#fff" }}
                  onClick={() => loadAll(true)}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
               <div style={{ textAlign: 'center' }}>
                 <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Gross Sales</span>
                 <p style={{ margin: 0, fontWeight: 'bold' }}>₹{(totalRevenue + totalRefunded).toLocaleString()}</p>
               </div>
               <div style={{ textAlign: 'center', borderLeft: '1px solid #333', borderRight: '1px solid #333' }}>
                 <span style={{ fontSize: '10px', color: '#e74c3c', textTransform: 'uppercase' }}>Total Refunded</span>
                 <p style={{ margin: 0, fontWeight: 'bold', color: '#e74c3c' }}>- ₹{totalRefunded.toLocaleString()}</p>
               </div>
               <div style={{ textAlign: 'center' }}>
                 <span style={{ fontSize: '10px', color: '#d4af37', textTransform: 'uppercase' }}>Net Revenue</span>
                 <p style={{ margin: 0, fontWeight: 'bold', color: '#d4af37' }}>₹{totalRevenue.toLocaleString()}</p>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                className="small-btn" 
                style={{ background: "rgba(212, 175, 55, 0.1)", color: "#d4af37", border: "1px solid #d4af37" }}
                onClick={() => {
                   // This is a simple client-side filter simulation if needed, 
                   // but for now we'll just show the highlight logic we added
                }}
              >
                All Tickets ({queries.length})
              </button>
              <button 
                className="small-btn" 
                style={{ background: "rgba(231, 76, 60, 0.2)", color: "#e74c3c", border: "1px solid #e74c3c" }}
              >
                Returns & Refunds ({queries.filter(q => q.ticketType === "Return / Refund" || q.ticketType === "Refund Request").length})
              </button>
            </div>

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
                      <td>
                        <span className="badge-premium" style={{ 
                          background: q.ticketType === "Return / Refund" ? "rgba(231, 76, 60, 0.2)" : "rgba(212, 175, 55, 0.1)",
                          color: q.ticketType === "Return / Refund" ? "#e74c3c" : "#d4af37",
                          border: q.ticketType === "Return / Refund" ? "1px solid rgba(231, 76, 60, 0.4)" : "1px solid rgba(212, 175, 55, 0.3)"
                        }}>
                          {q.ticketType}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: q.issueType?.includes("Refund") ? "#e74c3c" : "#d4af37",
                          fontWeight: q.issueType?.includes("Refund") ? "900" : "600"
                        }}>
                          {q.issueType}
                        </span>
                      </td>
                      <td>{q.orderId || "N/A"}</td>
                      <td style={{ maxWidth: "200px", fontSize: "12px" }}>{q.message}</td>

                      <td>
                        <select
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
                              <option value="" disabled>✨ Select Reply Template...</option>
                              <option value="We sincerely apologize for the inconvenience. For the wrong product received, your return pickup has been scheduled. The order will be pickup in 3 days. Replacement will be sent post pickup.">Reply Template: Wrong Item (3-Day Pickup)</option>
                              <option value="We apologize that the scent did not meet your expectations. We have approved your return request. Please pack the item securely for pickup. Note: Return accepted as per 48h policy.">Reply Template: Scent Return Approved (48h)</option>
                              <option value="We are terribly sorry about the damaged bottle. We have initiated a full refund to your original payment method. As per our 24-hour promise, the amount will be credited within 24 hours.">Reply Template: Damaged Bottle (Full Refund)</option>
                              <option value="Your refund request is approved. Our finance team has initiated the transaction. You will receive the credit in your account within 24 business hours as per DEZA luxury standards.">Reply Template: Refund Approved (Initate Transfer)</option>
                              <option value="Thank you for reaching out. Your exchange request for a different size/fragrance has been noted. Our team will contact you for pickup within 48 hours.">Reply Template: Exchange Acknowledged</option>
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
                                disabled={refundingIds.has(q._id)}
                                style={{ 
                                  marginTop: "5px", 
                                  marginLeft: "5px", 
                                  background: refundingIds.has(q._id) ? "#555" : "#f44336", 
                                  border: "1px solid #d32f2f",
                                  cursor: refundingIds.has(q._id) ? "not-allowed" : "pointer"
                                }}
                              >
                                {refundingIds.has(q._id) ? "🔄 Processing..." : "Initiate Refund 💸"}
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

        {/* SUBSCRIBERS */}
        {activeTab === "subscribers" && (
          <div className="admin-section">
            <div className="flex-between">
              <div>
                <h2>📧 "The Deza Edit" Newsletter Subscribers</h2>
                <p className="admin-subtitle">Send your luxury collections and boutique updates to these emails.</p>
              </div>
              <button 
                className="lux-btn" 
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => setShowNewsletterForm(!showNewsletterForm)}
              >
                {showNewsletterForm ? "✕ Cancel" : "📢 Send Newsletter Broadcast"}
              </button>
            </div>

            {showNewsletterForm && (
              <form 
                onSubmit={handleSendNewsletter}
                style={{ 
                  background: "rgba(212, 175, 55, 0.05)", 
                  padding: "25px", 
                  borderRadius: "15px", 
                  border: "1px solid rgba(212, 175, 55, 0.2)",
                  marginBottom: "30px",
                  animation: "slideDown 0.4s ease"
                }}
              >
                <h3 style={{ color: "#D4AF37", marginBottom: "20px" }}>Compose Broadcast ✍️</h3>
                <div className="form-grid">
                  <label>
                    Email Subject
                    <input 
                      type="text" 
                      placeholder="e.g. Introducing The Oud Royal Collection" 
                      value={newsSubject}
                      onChange={(e) => setNewsSubject(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Banner/Main Title
                    <input 
                      type="text" 
                      placeholder="e.g. NEW LAUNCH: THE OUD ROYAL" 
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <label style={{ marginTop: "15px" }}>
                  Message Content (HTML allowed)
                  <textarea 
                    rows="6" 
                    placeholder="Describe your new collection or offer details here..." 
                    value={newsBody}
                    onChange={(e) => setNewsBody(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="lux-btn" disabled={sendingEmail} style={{ marginTop: "20px" }}>
                  {sendingEmail ? "🔄 Broadcasting... Please wait" : "🚀 Send to All Subscribers Now"}
                </button>
              </form>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th>Joined On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s._id}>
                      <td>{s.email}</td>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td><span style={{ color: "#2ecc71" }}>● Subscribed</span></td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: "center" }}>No active subscribers.</td></tr>
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

        {/* HERO SECTION EDITOR */}
        {activeTab === "hero" && (
          <div className="admin-section">
            <AdminHeroEditor />
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarBtn({ icon, label, active, onClick, className = "" }) {
  return (
    <button className={`sidebar-btn ${active ? "active" : ""} ${className}`} onClick={onClick}>
      <span className="btn-icon">{icon}</span>
      <span className="btn-label">{label}</span>
    </button>
  );
}
