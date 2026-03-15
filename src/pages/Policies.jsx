import React, { useState } from "react";
import "./Policies.css"; // Reusing policy styles for consistency

export default function FAQ() {
  const [activeTab, setActiveTab] = useState(0);

  const faqs = [
    {
      question: "How long does delivery take?",
      answer: "We aim to deliver all luxury orders within 3-5 business days across India. Mumbai deliveries are usually faster (1-2 days)."
    },
    {
      question: "Are DEZA perfumes long-lasting?",
      answer: "Yes! All our fragrances are formulated as 'Extrait de Parfum' or concentrated 'Eau de Parfum', ensuring 8-12 hours of longevity on skin and longer on fabric."
    },
    {
      question: "Can I return a perfume if I don't like the scent?",
      answer: "For hygiene reasons, we only accept returns if the outer seal is intact. We recommend trying our 8ml travel sizes before committing to a full 50ml bottle."
    },
    {
      question: "Are your products authentic?",
      answer: "DEZA is a luxury house. All products sold on deza.in are 100% authentic, original, and shipped directly from our artisanal warehouse."
    },
    {
      question: "How do I track my order?",
      answer: "Once shipped, you will receive a WhatsApp message with a tracking link. You can also visit our 'Track Order' page and enter your Order ID."
    }
  ];

  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1 className="policy-title">Frequently Asked Questions</h1>
        <p className="policy-intro">Find quick answers to common questions about DEZA luxury fragrances.</p>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeTab === index ? "active" : ""}`}
              onClick={() => setActiveTab(activeTab === index ? -1 : index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-toggle">{activeTab === index ? "−" : "+"}</span>
              </div>
              {activeTab === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
