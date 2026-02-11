import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Shop.css";

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("default");

  // Categories & Types (from Admin)
  const categories = ["All", "Men", "Women", "Unisex"];
  const types = ["All", "Deza", "Recreational"];

  useEffect(() => {
    const storedProducts =
      JSON.parse(localStorage.getItem("dezaProducts")) || [];
    setProducts(storedProducts);

    const storedReviews = JSON.parse(localStorage.getItem("dezaReviews")) || [];
    setReviews(storedReviews);
  }, []);

  // Add rating to each product
  const productsWithRating = products.map((p) => {
    const productReviews = reviews.filter((r) => r.productId === p.id);
    const avgRating = productReviews.length
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length
      : 0;
    return { ...p, rating: avgRating, ratingCount: productReviews.length };
  });

  // FILTER + SEARCH
  let filteredProducts = productsWithRating.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    const matchesType = type === "All" || p.type === type;
    return matchesSearch && matchesCategory && matchesType;
  });

  // SORT
  filteredProducts.sort((a, b) => {
    if (sort === "priceLow") return a.price - b.price;
    if (sort === "priceHigh") return b.price - a.price;
    if (sort === "ratingHigh") return (b.rating || 0) - (a.rating || 0);
    if (sort === "ratingLow") return (a.rating || 0) - (b.rating || 0);
    return 0;
  });

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
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((t) => (
            <option key={t} value={t}>
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
                ⭐ {p.rating.toFixed(1)} ({p.ratingCount || 0})
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
