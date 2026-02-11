import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Shop.css";

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("default");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dezaProducts")) || [];
    setProducts(stored);
  }, []);

  // FILTER + SEARCH
  let filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    const matchesType = type === "All" || p.type === type;
    return matchesSearch && matchesCategory && matchesType;
  });

  // SORT
  if (sort === "priceLow") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === "priceHigh")
    filteredProducts.sort((a, b) => b.price - a.price);
  else if (sort === "ratingHigh")
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sort === "ratingLow")
    filteredProducts.sort((a, b) => (a.rating || 0) - (b.rating || 0));

  // UNIQUE CATEGORIES + TYPES
  const categories = ["All", "Recreational", "Deza Original"];
  const types = ["All", "Men", "Women", "Unisex"];

  return (
    <div className="shop-page">
      <h1 className="shop-title">DEZA Shop</h1>

      {/* FILTERS */}
      <div className="shop-filters">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="shop-search"
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((t, i) => (
            <option key={i} value={t}>
              {t}
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

      {/* PRODUCTS GRID */}
      <div className="shop-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div
              className="shop-card"
              key={p.id}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="shop-img-container">
                <img src={p.image} alt={p.title} className="shop-img" />
              </div>

              <h2 className="shop-card-title">{p.title}</h2>
              <p className="shop-price">₹{p.price}</p>
              <p className="shop-rating">
                ⭐ {p.rating ? p.rating.toFixed(1) : "0.0"} (
                {p.ratingCount || 0})
              </p>
              <p className="shop-category">
                {p.category} • {p.type}
              </p>
            </div>
          ))
        ) : (
          <p className="no-products">No products found 😢</p>
        )}
      </div>
    </div>
  );
}
