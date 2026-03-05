import React, { useState, useEffect } from "react";
import "./MyTickets.css";
import { apiGetMyQueries } from "../utils/api";
import { FaTicketAlt, FaClock, FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MyTickets() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadTickets();
        } else {
            // Check localStorage if context is still loading
            const stored = JSON.parse(localStorage.getItem("currentUser"));
            if (!stored) {
                const timer = setTimeout(() => {
                    if (!user) navigate("/login");
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [user]);

    const loadTickets = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            console.log(`🔍 Fetching tickets for: ${user.email}`);
            const data = await apiGetMyQueries(user.email);
            setTickets(data);
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Resolved": return <FaCheckCircle className="status-icon resolved" />;
            case "In Review": return <FaClock className="status-icon review" />;
            default: return <FaExclamationCircle className="status-icon pending" />;
        }
    };

    return (
        <div className="my-tickets-page">
            <div className="tickets-container">
                <header className="tickets-header">
                    <div className="header-top">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <FaArrowLeft /> Back
                        </button>
                        <button className="refresh-btn" onClick={loadTickets} title="Refresh Tickets">
                            <FaSync className={loading ? "spin" : ""} /> Refresh
                        </button>
                    </div>
                    <h1><FaTicketAlt /> My Support Tickets</h1>
                    <p>Track the status of your queries and support requests</p>
                </header>

                {loading ? (
                    <div className="loader">Searching for your tickets...</div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎟️</div>
                        <h3>No tickets found</h3>
                        <p>If you need help, you can raise a query from our contact page.</p>
                        <button className="contact-btn" onClick={() => navigate("/contact")}>Contact Support</button>
                    </div>
                ) : (
                    <div className="tickets-list">
                        {tickets.map(ticket => (
                            <div key={ticket._id} className={`ticket-card ${ticket.status.toLowerCase().replace(" ", "-")}`}>
                                <div className="ticket-main">
                                    <div className="ticket-id">DZ-{String(ticket._id).slice(-6).toUpperCase()}</div>
                                    <div className="ticket-status">
                                        {getStatusIcon(ticket.status)}
                                        <span>{ticket.status}</span>
                                    </div>
                                    <div className="ticket-date">{new Date(ticket.createdAt || ticket.date).toLocaleDateString()}</div>
                                </div>

                                <div className="ticket-message">
                                    <strong>Target message:</strong>
                                    <p>{ticket.message}</p>
                                </div>

                                {ticket.adminReply && (
                                    <div className="admin-response">
                                        <div className="response-header">Our Response:</div>
                                        <p>{ticket.adminReply}</p>
                                        <small>Replied on: {ticket.repliedAt}</small>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
