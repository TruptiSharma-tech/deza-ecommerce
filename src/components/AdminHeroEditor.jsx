import React, { useEffect, useState } from "react";
import { apiGetHeroSettings, apiUpdateHeroSettings } from "../utils/api";
import toast from "react-hot-toast";

export default function AdminHeroEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [headline, setHeadline] = useState("");
    const [subheadline, setSubheadline] = useState("");
    const [ctaText, setCtaText] = useState("");
    const [ctaLink, setCtaLink] = useState("");
    const [bannerHeight, setBannerHeight] = useState("75vh");
    const [objectFit, setObjectFit] = useState("cover");
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await apiGetHeroSettings();
            setHeadline(data.headline || "");
            setSubheadline(data.subheadline || "");
            setCtaText(data.ctaText || "");
            setCtaLink(data.ctaLink || "/shop");
            setBannerHeight(data.bannerHeight || "75vh");
            setObjectFit(data.objectFit || "cover");
            setBanners(data.banners || []);
        } catch {
            toast.error("Failed to load hero settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validation: Ensure all banners have images
        const emptyImageBanner = banners.find(b => !b.image);
        if (emptyImageBanner) {
            toast.error("All banners must have an image! Please upload images for all banners.");
            return;
        }

        setSaving(true);
        try {
            await apiUpdateHeroSettings({
                headline,
                subheadline,
                ctaText,
                ctaLink,
                bannerHeight,
                objectFit,
                banners,
            });
            toast.success("Hero section updated! Changes are live. ✨");
        } catch (err) {
            toast.error(err.message || "Failed to save hero settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleBannerImageUpload = (index, file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large! Max 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const updated = [...banners];
            updated[index] = { ...updated[index], image: reader.result };
            setBanners(updated);
        };
        reader.readAsDataURL(file);
    };

    const addBanner = () => {
        setBanners([
            ...banners,
            { image: "", title: "", subtitle: "", buttonText: "Shop Now", buttonLink: "/shop", isActive: true, order: banners.length },
        ]);
    };

    const removeBanner = (index) => {
        setBanners(banners.filter((_, i) => i !== index));
    };

    const updateBannerField = (index, field, value) => {
        const updated = [...banners];
        updated[index] = { ...updated[index], [field]: value };
        setBanners(updated);
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#d4af37" }}>
                Loading hero settings...
            </div>
        );
    }

    return (
        <div style={{ padding: "0" }}>
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "30px", flexWrap: "wrap", gap: "12px"
            }}>
                <div>
                    <h2 style={{ color: "#d4af37", fontSize: "22px", margin: 0 }}>🏠 Hero Section Editor</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "4px 0 0" }}>
                        Customize the home page hero banners, headlines, and CTAs
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        background: "linear-gradient(135deg, #d4af37, #b8952e)",
                        color: "#0a0a0a",
                        border: "none",
                        padding: "12px 32px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        cursor: saving ? "wait" : "pointer",
                        opacity: saving ? 0.6 : 1,
                    }}
                >
                    {saving ? "Saving..." : "💾 Save Changes"}
                </button>
            </div>

            {/* Text Fields */}
            <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
            }}>
                <h3 style={{ color: "#d4af37", fontSize: "16px", marginBottom: "16px" }}>📝 Hero Text</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                        <label style={labelStyle}>Headline</label>
                        <input
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            placeholder="Luxury Perfumes for Every Mood"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>CTA Button Text</label>
                        <input
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            placeholder="Find Your Scent ✨"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>Subheadline</label>
                    <textarea
                        value={subheadline}
                        onChange={(e) => setSubheadline(e.target.value)}
                        placeholder="Discover the signature fragrance collection by DEZA."
                        rows={2}
                        style={{ ...inputStyle, resize: "vertical" }}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={labelStyle}>CTA Button Link</label>
                        <input
                            value={ctaLink}
                            onChange={(e) => setCtaLink(e.target.value)}
                            placeholder="/shop"
                            style={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Banner Dimensions */}
            <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
            }}>
                <h3 style={{ color: "#d4af37", fontSize: "16px", marginBottom: "16px" }}>📏 Banner Dimensions & Style</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={labelStyle}>Banner Height (e.g. 100vh, 75vh, 500px)</label>
                        <input
                            value={bannerHeight}
                            onChange={(e) => setBannerHeight(e.target.value)}
                            placeholder="75vh"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Image Fit Style</label>
                        <select
                            value={objectFit}
                            onChange={(e) => setObjectFit(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="cover">Cover (Fills banner, crops edges)</option>
                            <option value="contain">Contain (Shows full image, adds bars)</option>
                            <option value="fill">Fill (Stretches image to fit)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Banner Cards */}
            <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "24px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ color: "#d4af37", fontSize: "16px", margin: 0 }}>
                        🖼️ Hero Banners ({banners.length})
                    </h3>
                    <button
                        onClick={addBanner}
                        style={{
                            background: "rgba(212,175,55,0.15)",
                            border: "1px solid rgba(212,175,55,0.4)",
                            color: "#d4af37",
                            padding: "8px 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "13px",
                        }}
                    >
                        + Add Banner
                    </button>
                </div>

                {banners.length === 0 && (
                    <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "30px" }}>
                        No banners added. Default product images will be shown. Click "Add Banner" to customize.
                    </p>
                )}

                {banners.map((banner, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "200px 1fr auto",
                            gap: "20px",
                            alignItems: "start",
                            padding: "20px",
                            marginBottom: "16px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "12px",
                        }}
                    >
                        {/* Image preview + upload */}
                        <div>
                            <div style={{
                                width: "200px",
                                height: "120px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: "#111",
                                marginBottom: "8px",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}>
                                {banner.image ? (
                                    <img
                                        src={banner.image}
                                        alt={`Banner ${idx + 1}`}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
                                        No image
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerImageUpload(idx, e.target.files[0])}
                                style={{ width: "100%", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
                            />
                            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
                                Recommended: 1920×800px, max 5MB
                            </p>
                        </div>

                        {/* Fields */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <input
                                value={banner.title || ""}
                                onChange={(e) => updateBannerField(idx, "title", e.target.value)}
                                placeholder="Banner Title"
                                style={inputStyle}
                            />
                            <input
                                value={banner.subtitle || ""}
                                onChange={(e) => updateBannerField(idx, "subtitle", e.target.value)}
                                placeholder="Banner Subtitle"
                                style={inputStyle}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <input
                                    value={banner.buttonText || ""}
                                    onChange={(e) => updateBannerField(idx, "buttonText", e.target.value)}
                                    placeholder="Button Text"
                                    style={inputStyle}
                                />
                                <input
                                    value={banner.buttonLink || ""}
                                    onChange={(e) => updateBannerField(idx, "buttonLink", e.target.value)}
                                    placeholder="Button Link"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => removeBanner(idx)}
                            title="Remove banner"
                            style={{
                                background: "rgba(255,70,70,0.15)",
                                border: "1px solid rgba(255,70,70,0.3)",
                                color: "#ff4646",
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* Preview note */}
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "16px", textAlign: "center" }}>
                💡 Changes will appear on the home page immediately after saving. If no banners are added, default DEZA product images are used.
            </p>
        </div>
    );
}

const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "1px",
};

const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.3s",
    boxSizing: "border-box",
};
