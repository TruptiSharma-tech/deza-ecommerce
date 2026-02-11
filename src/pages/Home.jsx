import "./Home.css";
import heroImg from "../assets/deza-perfume.png";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Luxury <span>Perfumes</span> <br /> for Every Mood
          </h1>

          <p>
            Discover the signature fragrance collection by DEZA. Elegant, bold,
            long-lasting perfumes designed to match your personality.
          </p>

          <div className="hero-buttons">
            <button className="btn-secondary" onClick={() => navigate("/shop")}>
              Find Your Scent ✨
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img src={heroImg} alt="DEZA Perfumes" />
        </div>
      </section>

      {/* FEATURED SECTION */}
      <section className="featured">
        <h2>Featured Collection</h2>

        <div className="product-grid">
          <div className="product-card">
            <h3>DEZA Noir</h3>
            <p>Bold. Dark. Magnetic.</p>
            <button>Add to Cart</button>
          </div>

          <div className="product-card">
            <h3>DEZA Blossom</h3>
            <p>Soft floral luxury.</p>
            <button>Add to Cart</button>
          </div>

          <div className="product-card">
            <h3>DEZA Oud Royale</h3>
            <p>Royal. Rich. Timeless.</p>
            <button>Add to Cart</button>
          </div>
        </div>
      </section>
    </div>
  );
}
