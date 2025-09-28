import React, { useEffect, useState } from "react";
import { Clock, Edit3, CheckCircle, XCircle } from "lucide-react";

/**
 * Props:
 * - order: { id, table: { name }, items: [{menuItem, quantity}], total, status, createdAt, updatedAt }
 * - onEdit, onDelete, onServe
 */
export default function OrderCard({ order, onEdit, onDelete, onServe }) {
    const [elapsed, setElapsed] = useState(() => diffSeconds(order.createdAt));

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(diffSeconds(order.createdAt));
        }, 1000);
        return () => clearInterval(timer);
    }, [order.createdAt]);

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const elapsedStr = `${pad(minutes)}:${pad(seconds)}`;

    const statusColor =
        order.status === "PENDING"
            ? "bg-amber-100 text-amber-800 border-amber-200"
            : order.status === "PAID"
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : "bg-slate-100 text-slate-600 border-slate-200";

    return (
        <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-between border hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    {/* <div className="text-xs uppercase tracking-wide text-slate-500">
                        Bàn
                    </div> */}
                    <div className="text-2xl font-bold text-slate-800">
                        {order.table.name}
                    </div>
                </div>
                <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}
                >
                    {order.status}
                </div>
            </div>

            {/* Items */}
            <div className="mt-4">
                <div className="text-sm text-slate-600 mb-3 flex items-center justify-between">
                    <span>
                        <strong>{order.items.length}</strong> món
                    </span>
                    <span className="font-bold text-emerald-600 text-lg">
                        {order.total.toLocaleString()}₫
                    </span>
                </div>

                <ul className="text-sm text-slate-700 space-y-1 max-h-28 overflow-auto pr-1">
                    {order.items.slice(0, 4).map((it, idx) => (
                        <li
                            key={idx}
                            className="flex justify-between items-center"
                        >
                            <span className="truncate pr-2 text-slate-800">
                                {it.menuItem.name} ×{" "}
                                <span className="font-semibold">
                                    {it.quantity}
                                </span>
                            </span>
                            <span className="text-slate-600">
                                {(it.menuItem.price * it.quantity).toLocaleString()}₫
                            </span>
                        </li>
                    ))}
                    {order.items.length > 4 && (
                        <li className="text-xs text-slate-400 italic">
                            + {order.items.length - 4} món khác
                        </li>
                    )}
                </ul>

                {/* Thời gian vào/ra */}
                <div className="mt-4 text-xs text-slate-500 space-y-1 border-t pt-2">
                    <div>
                        ⏱ Vào:{" "}
                        <span className="font-medium">
                            {new Date(order.createdAt).toLocaleString()}
                        </span>
                    </div>
                    {order.status !== "PENDING" && order.updatedAt ? (
                        <div>
                            🏁 Ra:{" "}
                            <span className="font-medium">
                                {new Date(order.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between">
                {order.status === "PENDING" ? (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={14} /> {elapsedStr}
                    </div>
                ) : (
                    <div />
                )}

                {order.status === "PENDING" && (
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-slate-50 transition"
                        >
                            <Edit3 size={14} /> Sửa
                        </button>

                        <button
                            onClick={() => onServe(order)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 transition"
                        >
                            <CheckCircle size={14} /> Thanh Toán
                        </button>

                        <button
                            onClick={onDelete}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                            <XCircle size={14} /> Huỷ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ===== Helpers ===== */
function pad(n) {
    return String(n).padStart(2, "0");
}

function diffSeconds(iso) {
    return Math.max(
        0,
        Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    );
}
