// pages/OrderSuccess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import Confetti from "react-confetti";
import "./OrderSucess.css";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const lastOrder = JSON.parse(localStorage.getItem("dezaOrders"))?.slice(
    -1,
  )[0];
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!lastOrder) navigate("/shop");

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [lastOrder, navigate]);

  const generateBillPDF = () => {
    if (!lastOrder) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DEZA - Invoice", 10, 10);
    doc.text(`Order ID: ${lastOrder.id}`, 10, 20);
    doc.text(`Name: ${lastOrder.name}`, 10, 30);
    doc.text(`Phone: ${lastOrder.phone}`, 10, 40);
    doc.text(`Address: ${lastOrder.address}`, 10, 50);
    doc.text(`Payment: ${lastOrder.paymentMethod}`, 10, 60);

    doc.text("Products:", 10, 70);
    lastOrder.items.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.name} (Size: ${item.selectedSize}) x${item.qty} - ₹${item.price * item.qty}`,
        10,
        80 + i * 10,
      );
    });

    doc.text(
      `Total: ₹${lastOrder.total}`,
      10,
      80 + lastOrder.items.length * 10 + 10,
    );
    doc.save(`DEZA_Order_${lastOrder.id}.pdf`);
  };

  return (
    <div className="checkout-page">
      {showConfetti && <Confetti />}
      <div className="success-animation">
        <div className="checkmark">&#10003;</div>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for shopping with DEZA 💛</p>
      </div>

      <button className="checkout-btn" onClick={generateBillPDF}>
        Download Bill PDF
      </button>
      <button className="checkout-btn" onClick={() => navigate("/orders")}>
        Go to My Orders
      </button>
    </div>
  );
}
