import "./About.css";
import aboutImg from "../assets/deza-perfume.png";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate(); // Hook to programmatically navigate

  const goToShop = () => {
    navigate("/shop"); // Redirect to Shop page
  };

  return (
    <div className="about">
      {/* HERO SECTION */}
      <section className="about-hero">
        <div className="about-overlay"></div>

        <div className="about-hero-content">
          <h1>The Essence of DEZA</h1>
          <p>Where Heritage Meets the Avant-Garde.</p>
        </div>
      </section>

      {/* INTRO STORY */}
      <section className="about-intro">
        <div className="about-intro-text">
          <h2>Luxury That Speaks Without Words</h2>
          <p>
            Born from a desire to capture the ephemeral, Deza Perfumes is a
            house of olfactory art dedicated to the bold and the refined.
          </p>

          <p>
            We believe that a fragrance is more than a scent — it is an
            invisible couture, a silent language that speaks of where you have
            been and the legacy you leave behind.
          </p>
        </div>

        <div className="about-intro-img">
          <img src={aboutImg} alt="Deza Perfume" />
        </div>
      </section>

      {/* HIGHLIGHT QUOTE */}
      <section className="about-quote">
        <h2>
          “At DEZA, we don’t just create perfumes; we bottle the intangible.”
        </h2>
      </section>

      {/* GLOBAL INGREDIENTS SECTION */}
      <section className="about-details">
        <h2>Crafted with Rare Ingredients</h2>
        <p>
          We traverse the globe to source the most exquisite raw materials —
          from the midnight-blooming jasmine of Grasse to the deep, resinous oud
          of Southeast Asia.
        </p>

        <div className="about-detail-grid">
          <div className="detail-box">
            <h3>Grasse Jasmine</h3>
            <p>Midnight blooming floral elegance.</p>
          </div>

          <div className="detail-box">
            <h3>Southeast Asian Oud</h3>
            <p>Deep, resinous, unforgettable intensity.</p>
          </div>

          <div className="detail-box">
            <h3>French Alchemy</h3>
            <p>Traditional craft fused with modern daring.</p>
          </div>
        </div>
      </section>

      {/* FINAL STATEMENT */}
      <section className="about-ending">
        <h2>Signature. Bold. Timeless.</h2>
        <p>
          By marrying the precision of traditional French alchemy with a daring,
          modern sensibility, we create complex compositions that evolve on the
          skin, revealing a story that is uniquely yours.
        </p>

        <p>Every spray is an invitation to evoke your most powerful self.</p>

        {/* Button now navigates to Shop page */}
        <button className="about-btn" onClick={goToShop}>
          Explore Our Collection
        </button>
      </section>
    </div>
  );
}
