import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./Dashboard.css";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        active: 0,
        completed: 0
    });

    // PROTECT DASHBOARD
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/auth");
            return;
        }

        fetch(`${API_BASE_URL}/api/orders/my-orders`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {

                if (!Array.isArray(data)) return;

                setOrders(data);

                const totalOrders = data.length;
                const totalSpent = data.reduce((sum, o) => sum + o.price, 0);
                const active = data.filter(o => o.status !== "Completed").length;
                const completed = data.filter(o => o.status === "Completed").length;

                setStats({
                    totalOrders,
                    totalSpent,
                    active,
                    completed
                });

            });

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-wrapper">

            {/* SIDEBAR */}
            <div className="dashboard-sidebar">

                <div>
                    <h2>Nexus3D</h2>

                    <nav className="sidebar-nav">

                        <button
                            className={activeTab === "dashboard" ? "active" : ""}
                            onClick={() => setActiveTab("dashboard")}
                        >
                            Dashboard
                        </button>

                        <button
                            className={activeTab === "orders" ? "active" : ""}
                            onClick={() => setActiveTab("orders")}
                        >
                            Orders
                        </button>

                        <button
                            className={activeTab === "invoices" ? "active" : ""}
                            onClick={() => setActiveTab("invoices")}
                        >
                            Invoices
                        </button>

                        <button onClick={() => navigate("/upload")}>
                            Upload STL
                        </button>

                    </nav>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>

            </div>

            {/* MAIN */}
            <div className="dashboard-main">

                {activeTab === "dashboard" && (
                    <>
                        <h1>Premium Dashboard 🚀</h1>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Total Orders</h3>
                                <p>{stats.totalOrders}</p>
                            </div>

                            <div className="stat-card">
                                <h3>Total Spent</h3>
                                <p>₹ {stats.totalSpent}</p>
                            </div>

                            <div className="stat-card">
                                <h3>Active</h3>
                                <p>{stats.active}</p>
                            </div>

                            <div className="stat-card">
                                <h3>Completed</h3>
                                <p>{stats.completed}</p>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "orders" && (
                    <>
                        <h1>Your Orders</h1>

                        {orders.length === 0 ? (
                            <p>No orders yet.</p>
                        ) : (
                            orders.map(order => (
                                <div key={order._id} className="order-card">
                                    <h3>{order.material}</h3>
                                    <p>Status: {order.status}</p>
                                    <p>₹ {order.price}</p>
                                </div>
                            ))
                        )}
                    </>
                )}

                {activeTab === "invoices" && (
                    <>
                        <h1>Your Invoices</h1>

                        {orders.length === 0 ? (
                            <p>No invoices available.</p>
                        ) : (
                            orders.map(order => (
                                <div key={order._id} className="order-card">

                                    <h3>{order.material}</h3>
                                    <p>₹ {order.price}</p>

                                    <div className="progress-container">

                                        {["Pending", "Printing", "Shipped", "Completed"].map((step, index) => {

                                            const isActive =
                                                ["Pending", "Printing", "Shipped", "Completed"]
                                                    .indexOf(order.status) >= index;

                                            return (
                                                <div
                                                    key={step}
                                                    className={`progress-step ${isActive ? "active" : ""}`}
                                                >
                                                    {step}
                                                </div>
                                            );
                                        })}

                                    </div>

                                </div>
                            ))
                        )}
                    </>
                )}

            </div>

        </div>
    );
}
