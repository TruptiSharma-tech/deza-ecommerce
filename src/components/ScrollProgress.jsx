import React, { useState, useEffect } from "react";

const ScrollProgress = () => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScroll(scrolled);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: `${scroll}%`,
      height: "3px",
      background: "linear-gradient(to right, #d4af37, #f9f7f2)",
      zIndex: 2000,
      transition: "width 0.2s ease-out"
    }} />
  );
};

export default ScrollProgress;
