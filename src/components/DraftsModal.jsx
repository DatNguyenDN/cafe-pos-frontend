// src/components/DraftsModal.jsx
import React, { useEffect } from "react";
import { toVND } from "../utils/money";

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(d);
    } catch {
        return iso;
    }
}

export default function DraftsModal({
    open = false,
    onClose,
    drafts = [],
    onRestore,
    onDelete,
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
        >
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
                    <h3 className="text-lg font-bold">📂 Đơn tạm đã lưu</h3>
                    <button
                        onClick={onClose}
                        className="text-white/90 hover:text-white text-2xl leading-none"
                        aria-label="Đóng"
                        title="Đóng"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {drafts.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <div className="text-5xl mb-3">📭</div>
                            <p>Chưa có đơn tạm nào</p>
                            <p className="text-sm">
                                Hãy lưu đơn hiện tại để quản lý sau
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {drafts.map((d) => {
                                const itemCount = (d.items || []).reduce(
                                    (sum, it) => sum + (it.qty || 0),
                                    0
                                );
                                return (
                                    <div
                                        key={d.id}
                                        className="py-3 flex items-start justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-900">
                                                Đơn tạm #
                                                {String(d.id).slice(-6)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Lưu lúc{" "}
                                                {formatDate(d.createdAt)} •{" "}
                                                {itemCount} món
                                            </div>
                                            <div className="mt-1 text-green-700 font-semibold">
                                                Tổng tiền: {toVND(d.total)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => {
                                                    onRestore?.(d.id);
                                                }}
                                                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                                title="Khôi phục đơn này"
                                            >
                                                ↩️ Khôi phục
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(d.id)}
                                                className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                title="Xoá đơn này"
                                            >
                                                🗑️ Xoá
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-100 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
