import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Shop.css";

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");

  // Toggle Tabs
  const [activeType, setActiveType] = useState("All");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];
    setProducts(stored);
  }, []);

  // FILTER + SEARCH
  let filteredProducts = products.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());

    // CATEGORY SUPPORT (ARRAY + STRING BOTH)
    const matchesCategory =
      category === "All" ||
      (Array.isArray(p.category)
        ? p.category.some(
            (c) => c.trim().toLowerCase() === category.toLowerCase(),
          )
        : String(p.category).trim().toLowerCase() === category.toLowerCase());

    // TYPE SUPPORT (ARRAY + STRING BOTH) ✅ FIXED
    const matchesType =
      activeType === "All" ||
      (Array.isArray(p.type)
        ? p.type.some(
            (t) => t.trim().toLowerCase() === activeType.toLowerCase(),
          )
        : String(p.type).trim().toLowerCase() === activeType.toLowerCase());

    return matchesSearch && matchesCategory && matchesType;
  });

  // SORT
  if (sort === "priceLow") {
    filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === "priceHigh") {
    filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "ratingHigh") {
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === "ratingLow") {
    filteredProducts.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  const categories = ["All", "Men", "Women", "Unisex"];

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1 className="shop-title">DEZA Shop</h1>
        <p className="shop-subtitle">
          Luxury fragrances crafted for elegance ✨
        </p>
      </div>

      {/* TYPE TOGGLE */}
      <div className="type-toggle">
        <button
          className={activeType === "All" ? "active" : ""}
          onClick={() => setActiveType("All")}
        >
          All Perfumes
        </button>

        <button
          className={activeType === "Deza Original" ? "active" : ""}
          onClick={() => setActiveType("Deza")}
        >
          Deza Original
        </button>

        <button
          className={activeType === "Recreational" ? "active" : ""}
          onClick={() => setActiveType("Recreational")}
        >
          Recreational
        </button>
      </div>

      {/* FILTERS */}
      <div className="shop-filters">
        <input
          type="text"
          placeholder="Search luxury perfumes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c, index) => (
            <option key={index} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Sort By</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="ratingHigh">Rating: High to Low</option>
          <option value="ratingLow">Rating: Low to High</option>
        </select>
      </div>

      {/* PRODUCTS */}
      <div className="shop-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div
              className="shop-card"
              key={p.id}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="img-wrap">
                <img src={p.image} alt={p.title} className="shop-img" />
              </div>

              <div className="shop-card-content">
                <h2 className="product-title">{p.title}</h2>

                <p className="shop-price">₹{p.price}</p>

                <p className="shop-rating">
                  ⭐ {p.rating ? p.rating.toFixed(1) : "0.0"} (
                  {p.ratingCount || 0})
                </p>

                <p className="shop-category">
                  {(Array.isArray(p.category)
                    ? p.category.join(", ")
                    : p.category) || "No Category"}{" "}
                  •{" "}
                  {(Array.isArray(p.type) ? p.type.join(", ") : p.type) ||
                    "No Type"}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${p.id}`);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No products found 😢</p>
        )}
      </div>
    </div>
  );
}
