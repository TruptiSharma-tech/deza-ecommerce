import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetProducts } from "../utils/api";
import "./Shop.css";

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("default");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiGetProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      // Fallback: seed collection message
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */

  let filteredProducts = products.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      (Array.isArray(p.categories)
        ? p.categories.includes(category)
        : p.categories === category);

    const matchesType =
      type === "All" ||
      (Array.isArray(p.types) ? p.types.includes(type) : p.types === type);

    return matchesSearch && matchesCategory && matchesType;
  });

  /* ================= SORT ================= */

  if (sort === "priceLow") {
    filteredProducts.sort(
      (a, b) =>
        Math.min(...(a.sizePrices || []).map((s) => Number(s.price))) -
        Math.min(...(b.sizePrices || []).map((s) => Number(s.price))),
    );
  }

  if (sort === "priceHigh") {
    filteredProducts.sort(
      (a, b) =>
        Math.min(...(b.sizePrices || []).map((s) => Number(s.price))) -
        Math.min(...(a.sizePrices || []).map((s) => Number(s.price))),
    );
  }

  if (sort === "ratingHigh") {
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (sort === "ratingLow") {
    filteredProducts.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1 className="shop-title">DEZA Shop</h1>
        <p className="shop-subtitle">
          Luxury fragrances crafted for elegance ✨
        </p>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="shop-filter-bar">
        <input
          type="text"
          placeholder="Search perfumes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Unisex">Unisex</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="All">All Types</option>
          <option value="Deza">Deza</option>
          <option value="Recreational">Recreational</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Sort By</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="ratingHigh">Rating: High to Low</option>
          <option value="ratingLow">Rating: Low to High</option>
        </select>
      </div>

      {/* ================= PRODUCTS ================= */}
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
                <img src={p.image} alt={p.title} className="shop-img" />

                <h2>{p.title}</h2>

                <p className="shop-price">
                  ₹
                  {p.sizePrices && p.sizePrices.length > 0
                    ? Math.min(
                      ...p.sizePrices.map((s) => Number(s.price)),
                    ).toLocaleString("en-IN")
                    : "Price Not Available"}
                </p>

                <div className="shop-rating" style={{ color: '#D4AF37', fontSize: '14px', marginBottom: '8px' }}>
                  {"⭐".repeat(Math.round(p.rating || 0))}
                  <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: '5px' }}>({p.rating || 0})</span>
                </div>

                <p className="shop-tags">
                  {(p.categories || []).join(", ")} • {(p.types || []).join(", ")}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${p._id}`);
                  }}
                >
                  View Details
                </button>
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
