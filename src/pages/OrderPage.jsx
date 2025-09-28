// src/pages/OrderPage.jsx
import React, { useEffect, useState, useRef } from "react";
import OrderCard from "../components/OrderCard";
import EditOrderModal from "../components/EditOrderModal";
import PaymentModal from "../components/PaymentModal";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { fetchOrders } from "../api/index"; // ✅ import hàm đã refactor

const TABS = ["pending", "paid", "cancelled"];

export default function OrderPage() {
    const [orders, setOrders] = useState([]);
    console.log("Orders:", orders);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();
    const socketRef = useRef(null);

    async function loadOrders() {
        setLoading(true);
        try {
            const data = await fetchOrders(); // ✅ dùng api helper
            setOrders(data);
        } catch (err) {
            console.error("Fetch orders failed:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();

        // realtime sub
        const orderSub = supabase
            .channel("public:order")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "order" },
                () => loadOrders()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(orderSub);
        };
    }, []);

    const filteredOrders = orders.filter(
        (o) => (o.status || "").toLowerCase() === activeTab
    );
    console.log("Filtered Orders:", filteredOrders);

    function handleOpenEdit(order) {
        setEditingOrder(order);
    }
    function handleCloseEdit() {
        setEditingOrder(null);
    }

    async function handleDelete(orderId) {
        if (!confirm("Bạn chắc chắn muốn huỷ order này?")) return;
        try {
            // set status cancelled
            await supabase
                .from("order")
                .update({
                    status: "CANCELLED",
                    cancelledAt: new Date().toISOString(),
                })
                .eq("id", orderId);
            loadOrders();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/pos")}
                        className="px-4 py-2 rounded-lg bg-white shadow-sm border hover:bg-slate-100"
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
                        {filteredOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onEdit={() => setEditingOrder(order)}
                                onDelete={() => handleDelete(order.id)}
                                onServe={() => setSelectedOrder(order)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Payment modal */}
            <PaymentModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                onConfirm={async () => {
                    if (!selectedOrder) return;
                    try {
                        await supabase
                            .from("order")
                            .update({
                                status: "PAID",
                                updatedAt: new Date().toISOString(),
                            })
                            .eq("id", selectedOrder.id);
                        setSelectedOrder(null);
                        loadOrders();
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onCancel={async (id, reason) => {
                    try {
                        await supabase
                            .from("order")
                            .update({
                                status: "cancelled",
                                cancelReason: reason,
                                cancelledAt: new Date().toISOString(),
                            })
                            .eq("id", id);
                        setSelectedOrder(null);
                        loadOrders();
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onPrint={() => console.log("Print", selectedOrder)}
            />

            {/* Edit order */}
            {editingOrder && (
                <EditOrderModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSaved={loadOrders}
                />
            )}
        </div>
    );
}
