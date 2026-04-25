import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetProducts, apiGetCategories, apiGetBrands } from "../utils/api";
import { FaStar } from "react-icons/fa";
import toast from "react-hot-toast";
import { useShop } from "../context/ShopContext";
import "./Shop.css";

export default function Shop() {
  const navigate = useNavigate();
  const { updateCart, currentUser } = useShop();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("default");

  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("category");
    const typeParam = params.get("type");
    const sortParam = params.get("sort");

    if (catParam) setCategory(catParam);
    if (typeParam) setType(typeParam);
    if (sortParam) setSort(sortParam);

    loadProducts();
    loadFilters();
  }, [window.location.search]);

  const loadFilters = async () => {
    try {
      const [cats, brs] = await Promise.all([apiGetCategories(), apiGetBrands()]);
      setCategoriesList(cats);
      setBrandsList(brs);
    } catch (e) {
      console.error("Failed to load filters", e);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiGetProducts(false, 1, 100);
      const data = Array.isArray(res) ? res : (res.products || []);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!currentUser) {
      toast.error("Please Login First to Continue!");
      navigate("/login");
      return;
    }

    const email = currentUser.email;
    const cartKey = `deza_cart_${email}`;
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(cartKey)) || [];
      if (!Array.isArray(cart)) cart = [];
    } catch (e) {
      cart = [];
    }

    const selectedSize = product.sizePrices?.[0]?.size || "Default";
    const price = product.sizePrices?.[0]?.price ? Number(product.sizePrices[0].price) : (product.price || 0);

    const existingIndex = cart.findIndex(
      (x) => String(x._id) === String(product._id) && x.selectedSize === selectedSize,
    );

    if (existingIndex !== -1) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({
        _id: product._id,
        name: product.title,
        price: price,
        image: product.image || product.mainImage || product.images?.[0],
        selectedSize,
        qty: 1,
      });
    }

    updateCart(cart);
    toast.success("Added to Cart! 🛒");
  };

  /* ================= FILTER & SORT (MEMOIZED) ================= */
  const filteredProducts = React.useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        (Array.isArray(p.categories)
          ? p.categories.some(c => c.toLowerCase() === category.toLowerCase())
          : p.categories?.toLowerCase() === category.toLowerCase());

      const matchesType =
        type === "All" ||
        (Array.isArray(p.types)
          ? p.types.some(t => t.toLowerCase() === type.toLowerCase())
          : p.types?.toLowerCase() === type.toLowerCase());

      return matchesSearch && matchesCategory && matchesType;
    });

    if (sort === "priceLow") {
      result.sort((a, b) => {
        const pA = a.sizePrices?.length ? Math.min(...a.sizePrices.map(s => Number(s.price))) : (a.price || 0);
        const pB = b.sizePrices?.length ? Math.min(...b.sizePrices.map(s => Number(s.price))) : (b.price || 0);
        return pA - pB;
      });
    } else if (sort === "priceHigh") {
      result.sort((a, b) => {
        const pA = a.sizePrices?.length ? Math.min(...a.sizePrices.map(s => Number(s.price))) : (a.price || 0);
        const pB = b.sizePrices?.length ? Math.min(...b.sizePrices.map(s => Number(s.price))) : (b.price || 0);
        return pB - pA;
      });
    } else if (sort === "ratingHigh") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "ratingLow") {
      result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    return result;
  }, [products, search, category, type, sort]);

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1 className="shop-title">DEZA Shop</h1>
        <p className="shop-subtitle">
          Luxury fragrances crafted for elegance ✨
        </p>
      </div>

      <div className="shop-filter-bar">
        <input
          type="text"
          placeholder="Search perfumes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {categoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="All">All Brands</option>
          {brandsList.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Sort By</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="ratingHigh">Rating: High to Low</option>
          <option value="ratingLow">Rating: Low to High</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#d4af37', fontSize: '18px' }}>
          Loading products...
        </div>
      ) : (
        <div className="shop-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div
                className="shop-card"
                key={p._id}
                onClick={() => navigate(`/product/${p._id}`)}
              >
                <img src={p.image} alt={p.title} className="shop-img" loading="lazy" />

                <h2>{p.title}</h2>

                <p className="shop-price">
                  ₹
                  {p.sizePrices && p.sizePrices.length > 0
                    ? Math.min(
                      ...p.sizePrices.map((s) => Number(s.price)),
                    ).toLocaleString("en-IN")
                    : "Price Not Available"}
                </p>

                <div className="shop-rating-row">
                  <div className="shop-stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <FaStar
                        key={i}
                        size={12}
                        color={i < Math.round(p.rating || 0) ? "#ffd369" : "rgba(255,255,255,0.15)"}
                      />
                    ))}
                  </div>
                  <span className="shop-rating-num">{Number(p.rating || 0).toFixed(1)}</span>
                </div>

                <p className="shop-tags">
                  {(p.categories || []).join(", ")} • {(p.types || []).join(", ")}
                </p>

                <div className="shop-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${p._id}`);
                    }}
                    style={{ flex: 1 }}
                  >
                    View Details
                  </button>
                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid #d4af37',
                      color: '#d4af37'
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-products">No products found 😢</p>
          )}
        </div>
      )}
    </div>
  );
}
