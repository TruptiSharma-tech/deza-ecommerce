import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetProducts, apiGetHeroSettings } from "../utils/api";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./Home.css";

// New hero images
import heroMain from "../assets/hero-main.png";
import heroOriginal from "../assets/hero-original.png";
import heroRecreational from "../assets/hero-recreational.png";
import heroPromo from "../assets/hero-promo.png";

const DEFAULT_BANNERS = [
  { image: heroMain, title: "The DEZA Collection", subtitle: "Noir | Blossom | Oud Royale", isLocal: true },
  { image: heroOriginal, title: "Original Collection", subtitle: "Crafting timeless elegance in every drop", isLocal: true },
  { image: heroRecreational, title: "Recreational Collection", subtitle: "Vibrant energy for the spontaneous soul", isLocal: true },
  { image: heroPromo, title: "", subtitle: "", isLocal: true, hideOverlay: true },
];

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroData, setHeroData] = useState({
    banners: DEFAULT_BANNERS,
    headline: "The Art of\nExquisite Scents",
    subheadline: "Original & Recreational Collections by DEZA. Bold, long-lasting fragrances crafted for those who define their own luxury.",
    ctaText: "EXPLORE COLLECTION",
    ctaLink: "/shop",
  });

  useEffect(() => {
    apiGetHeroSettings()
      .then((data) => {
        if (data && data.banners && data.banners.length > 0) setHeroData(data);
      })
      .catch(() => { });

    apiGetProducts()
      .then((data) => {
        const topRated = data.filter(p => (p.rating || 0) >= 4.5);
        const sorted = (topRated.length >= 2 ? topRated : data)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setFeatured(sorted.slice(0, 4));
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const banners = heroData.banners.length > 0 ? heroData.banners : DEFAULT_BANNERS;

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [banners.length, goNext]);

  const getMinPrice = (p) => {
    if (p.sizePrices?.length > 0) return Math.min(...p.sizePrices.map((s) => Number(s.price)));
    return p.price || null;
  };

  // Split headline for styling
  const renderHeadline = (text) => {
    const words = (text || "").replace(/\n/g, " ").split(" ");
    const goldWords = ["perfumes", "luxury", "mood", "collection", "elegance", "scent"];
    return words.map((word, i) =>
      goldWords.includes(word.toLowerCase())
        ? <span key={i}>{word} </span>
        : word + " "
    );
  };

  return (
    <div className="home">

      {/* ═══════════ HERO CAROUSEL ═══════════ */}
      <section className="hero-banner">
        {banners.map((banner, idx) => (
          <div className={`hero-slide ${idx === currentSlide ? "active" : ""}`} key={idx}>
            <img src={banner.image} alt={banner.title || `DEZA Slide ${idx + 1}`} />
          </div>
        ))}

        <div className={`hero-overlay ${banners[currentSlide]?.hideOverlay ? "hidden" : ""}`}>
          <p className="hero-tag">DEZA LUXURY PERFUMES</p>

          <h1 className="hero-main-title">
            {renderHeadline(heroData.headline)}
          </h1>

          <p className="hero-sub">{heroData.subheadline}</p>

          <div className="hero-cta-row">
            <button className="hero-cta-primary" onClick={() => navigate(heroData.ctaLink || "/shop")}>
              {heroData.ctaText || "SHOP NOW"}
            </button>
            <button className="hero-cta-secondary" onClick={() => navigate("/about")}>
              OUR STORY
            </button>
          </div>
        </div>

        {banners.length > 1 && (
          <>
            <button className="hero-arrow left" onClick={goPrev}><FaChevronLeft /></button>
            <button className="hero-arrow right" onClick={goNext}><FaChevronRight /></button>
          </>
        )}

        {banners.length > 1 && (
          <div className="hero-dots">
            {banners.map((_, idx) => (
              <button key={idx} className={`hero-dot ${idx === currentSlide ? "active" : ""}`} onClick={() => setCurrentSlide(idx)} />
            ))}
          </div>
        )}

        <div className="scroll-indicator">
          <span>SCROLL</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══════════ GOLD MARQUEE ═══════════ */}
      <div className="marquee-strip">
        <div className="marquee-inner">
          {[1, 2].map((n) => (
            <React.Fragment key={n}>
              <span>FREE SHIPPING ON ALL ORDERS</span>
              <span>★</span>
              <span>ORIGINAL & RECREATIONAL COLLECTIONS</span>
              <span>★</span>
              <span>100% AUTHENTIC FRAGRANCES</span>
              <span>★</span>
              <span>EASY 48-HOUR RETURNS</span>
              <span>★</span>
              <span>COD AVAILABLE</span>
              <span>★</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══════════ BROWSE BAR ═══════════ */}
      <div className="browse-bar">
        {[
          { icon: "✨", label: "Deza Original", filter: { type: "Deza" } },
          { icon: "🎨", label: "Recreational", filter: { type: "Recreational" } },
          { icon: "🧴", label: "Men", filter: { category: "Men" } },
          { icon: "🌸", label: "Women", filter: { category: "Women" } },
          { icon: "🌬️", label: "Unisex", filter: { category: "Unisex" } },
          { icon: "⭐", label: "Best Sellers", filter: { sort: "ratingHigh" } },
        ].map((cat) => (
          <button 
            key={cat.label} 
            className="browse-chip" 
            onClick={() => {
              const params = new URLSearchParams(cat.filter).toString();
              navigate(`/shop?${params}`);
            }}
          >
            <span className="chip-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ═══════════ FEATURE STRIP ═══════════ */}
      <div className="feature-strip">
        <div className="feature-item">
          <span className="feature-icon">🚚</span>
          <span className="feature-label">Free Delivery</span>
          <span className="feature-desc">Across India on all orders</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🔄</span>
          <span className="feature-label">Easy Returns</span>
          <span className="feature-desc">48-hour return window</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🛡️</span>
          <span className="feature-label">Authentic</span>
          <span className="feature-desc">Guaranteed genuine products</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">💳</span>
          <span className="feature-label">Secure Checkout</span>
          <span className="feature-desc">UPI, Cards & COD accepted</span>
        </div>
      </div>

      {/* ═══════════ FEATURED PRODUCTS ═══════════ */}
      <section className="showcase-section">
        <div className="section-header">
          <p className="section-tag">CURATED FOR YOU</p>
          <h2 className="section-title">Featured Collection</h2>
          <p className="section-subtitle">
            Our most-loved fragrances, chosen by those who know luxury
          </p>
        </div>

        <div className="showcase-grid">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-img" />
                <div className="skeleton-text">
                  <div className="skeleton-line w80" />
                  <div className="skeleton-line w60" />
                  <div className="skeleton-line w40" />
                </div>
              </div>
            ))
          ) : featured.length > 0 ? (
            featured.map((p, idx) => {
              const minPrice = getMinPrice(p);
              return (
                <div className="showcase-card" key={p._id} onClick={() => navigate(`/product/${p._id}`)}>

                  {p.rating >= 4.5 && <div className="showcase-card-badge">BESTSELLER</div>}
                  {p.rating >= 4.2 && p.rating < 4.5 && <div className="showcase-card-badge trending">TRENDING</div>}

                  <div className="showcase-card-img-wrap">
                    <img src={p.image} alt={p.title} className="showcase-card-img" />
                    <button className="showcase-quick-view" onClick={(e) => { e.stopPropagation(); navigate(`/product/${p._id}`); }}>
                      QUICK VIEW
                    </button>
                  </div>

                  <div className="showcase-card-body">
                    <h3 className="showcase-card-title">{p.title}</h3>
                    <p className="showcase-card-desc">
                      {p.description?.slice(0, 90)}{p.description?.length > 90 ? "..." : ""}
                    </p>

                    <div className="showcase-card-price-row">
                      <span className="showcase-card-price">
                        {minPrice && minPrice > 0 ? `₹${minPrice.toLocaleString("en-IN")}` : "Price coming soon"}
                      </span>
                      <div className="showcase-card-rating">
                        {Array.from({ length: 5 }, (_, i) => (
                          <FaStar key={i} size={12} color={i < Math.round(p.rating || 0) ? "#f0d060" : "#333"} />
                        ))}
                        <span style={{ marginLeft: 4 }}>({p.ratingCount || 0})</span>
                      </div>
                    </div>

                    <div className="showcase-card-divider" />

                    <button className="showcase-view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${p._id}`); }}>
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ gridColumn: "1/-1", textAlign: "center", opacity: 0.4, padding: "80px", fontFamily: "Cormorant Garamond, serif", fontSize: "18px", fontStyle: "italic" }}>
              New collection arriving soon. Stay tuned.
            </p>
          )}
        </div>

        <div className="view-all-row">
          <button className="view-all-btn" onClick={() => navigate("/shop")}>
            VIEW ALL PRODUCTS
          </button>
        </div>
      </section>

      {/* ═══════════ BRAND QUOTE ═══════════ */}
      <section className="brand-quote">
        <p className="brand-quote-text">
          "A fragrance is like a <em>signature</em> — it speaks before you do,
          and <em>lingers</em> long after you've gone."
        </p>
        <p className="brand-quote-author">— DEZA LUXURY PERFUMES</p>
      </section>
    </div>
  );
}
