import React, { useEffect, useState, useRef } from "react";
import OrderCard from "../components/OrderCard";
import EditOrderModal from "../components/EditOrderModal";
import { io } from "socket.io-client";
import { fetchOrders, cancelOrder } from "../api"; // dùng API sẵn có
import { useNavigate } from "react-router-dom";
import PaymentModal from "../components/PaymentModal";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TABS = ["pending", "paid", "cancelled"];

export default function OrderPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState(null);
    const [activeTab, setActiveTab] = useState("pending"); // mặc định pending
    const socketRef = useRef(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();
    console.log("Rendering selectedOrder, selectedOrder:", selectedOrder);
    // Load orders FIFO (createdAt asc)
    async function loadOrders() {
        setLoading(true);
        try {
            const data = await fetchOrders({ sort: "asc" });
            setOrders(
                data.sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                )
            );
        } catch (err) {
            console.error("Fetch orders failed:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();

        // Socket.IO for realtime updates
        socketRef.current = io(API, { path: "/ws/socket.io" });
        const s = socketRef.current;

        s.on("connect", () => {
            console.log("✅ Connected to WS");
        });

        s.on("order.created", (order) => {
            setOrders((prev) => {
                const next = [...prev, order];
                next.sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );
                return next;
            });
        });

        s.on("order.updated", (order) => {
            setOrders((prev) =>
                prev.map((o) => (o.id === order.id ? order : o))
            );
        });

        s.on("order.deleted", ({ id }) => {
            setOrders((prev) => prev.filter((o) => o.id !== id));
        });

        return () => {
            s.disconnect();
        };
    }, []);

    function handleOpenEdit(order) {
        setEditingOrder(order);
    }
    function handleCloseEdit() {
        setEditingOrder(null);
    }

    // async function handleMarkDone(orderId) {
    //     try {
    //         await fetch(`${API}/orders/${orderId}/complete`, {
    //             method: "POST",
    //         });
    //         // optimistic UI → socket sẽ update
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }

    async function handleDelete(orderId, reason) {
        if (!confirm("Bạn chắc chắn muốn huỷ order này?")) return;
        try {
            await cancelOrder(orderId, reason);
            loadOrders();
            // socket sẽ update
        } catch (err) {
            console.error(err);
        }
    }

    const filteredOrders = orders.filter(
        (o) => o.status.toLowerCase() === activeTab
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/pos")}
                        className="px-4 py-2 rounded-lg bg-white shadow-sm border hover:bg-slate-100 transition"
                    >
                        ⬅️ Quay lại
                    </button>
                    <h1 className="text-3xl font-bold">Order Board</h1>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={loadOrders}
                        className="px-4 py-2 rounded-md bg-white shadow-sm border hover:bg-slate-100"
                    >
                        Refresh
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 px-3 font-medium ${
                            activeTab === tab
                                ? "border-b-2 border-blue-500 text-blue-600"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <main>
                {loading ? (
                    <div>Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center text-slate-500">
                        No {activeTab} orders
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredOrders.map((order) => {
                            const total = order.items.reduce(
                                (sum, item) =>
                                    sum + item.quantity * item.menuItem.price,
                                0
                            );

                            const orderData = {
                                id: order.id,
                                items: order.items.map((item) => ({
                                    menuItemId: item.menuItem.id,
                                    name: item.menuItem.name,
                                    qty: item.quantity,
                                    price: item.menuItem.price,
                                })),
                                total,
                            };
                            console.log(
                                "Rendering orderData, orderData:",
                                orderData
                            );

                            return (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onEdit={() => handleOpenEdit(order)}
                                    onDelete={() => handleDelete(order.id)}
                                    onServe={() => setSelectedOrder(orderData)} // ✅ chỉ set orderData
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                onConfirm={() => {
                    console.log("Thanh toán", selectedOrder);
                    setSelectedOrder(null);
                }}
                onCancel={(id, reason) => {
                    console.log("Huỷ order", id, reason);
                    setSelectedOrder(null);
                    // loadOrders();
                }}
                onPrint={() => console.log("In bill", selectedOrder)}
            />

            {editingOrder && (
                <EditOrderModal
                    order={editingOrder}
                    onClose={handleCloseEdit}
                    onSaved={() => {
                        handleCloseEdit();
                        loadOrders();
                    }}
                />
            )}
        </div>
    );
}
