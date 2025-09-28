import React from "react";
import { toVND } from "../utils/money";
import PaymentModal from "./PaymentModal";
import { useState } from "react";

export default function CartPanel({
    cart = [],
    total = 0,
    onInc,
    onDec,
    onChangeQty,
    onRemove,
    onCheckout, // chính là handleCheckout bạn đã viết
    onClearAll,
    onSaveDraft,
    onOpenDrafts,
    draftsCount = 0,
    orderId, // truyền xuống để modal biết ID order
    onCancelOrder, // function huỷ order
}) {
    const [isPaymentOpen, setPaymentOpen] = useState(false);
    const orderData = {
        id: orderId,
        items: cart,
        total,
    };
    // console.log(
    //     "🚀 ~ file: CartPanel.jsx:26 ~ CartPanel ~ orderId:",
    //     orderData.id
    // );
    return (
        <>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                {/* Header giỏ hàng */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        🛒 Giỏ hàng
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenDrafts}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm transition-all"
                            title="Xem đơn tạm"
                        >
                            📂 Đơn tạm ({draftsCount})
                        </button>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                            {cart.reduce(
                                (sum, item) => sum + (item.qty || 0),
                                0
                            )}{" "}
                            món
                        </span>
                    </div>
                </div>

                {/* Danh sách giỏ */}
                <div className="flex-1 overflow-y-auto max-h-96 p-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <div className="text-6xl mb-4">🛒</div>
                            <p>Giỏ hàng trống</p>
                            <p className="text-sm">
                                Hãy chọn sản phẩm để bắt đầu
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((c) => (
                                <div
                                    key={c.id}
                                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            {/* THUMBNAIL ẢNH */}
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                                                {c.imageUrl ? (
                                                    <img
                                                        src={c.imageUrl}
                                                        alt={c.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) =>
                                                            (e.currentTarget.style.display =
                                                                "none")
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-xl">
                                                        🧃
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-gray-800">
                                                {c.name}
                                            </h4>
                                        </div>
                                        <button
                                            onClick={() => onRemove?.(c.id)}
                                            className="text-red-500 hover:text-red-700 text-xl leading-none"
                                            title="Xoá sản phẩm"
                                            aria-label={`Xoá ${c.name}`}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Hiển thị giờ thêm */}
                                    {c.addedAt && (
                                        <div className="text-xs text-gray-500 mb-2">
                                            ⏰{" "}
                                            {new Date(
                                                c.addedAt
                                            ).toLocaleTimeString("vi-VN")}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="text-green-600 font-semibold">
                                            {toVND(c.price)}
                                        </div>

                                        {/* Quantity controls */}
                                        <div className="flex items-center bg-white rounded-lg border-2 border-gray-200">
                                            <button
                                                onClick={() => onDec?.(c.id)}
                                                className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-bold"
                                                aria-label={`Giảm số lượng ${c.name}`}
                                            >
                                                −
                                            </button>
                                            <input
                                                min={1}
                                                value={c.qty}
                                                onChange={(e) =>
                                                    onChangeQty?.(
                                                        c.id,
                                                        Math.max(
                                                            1,
                                                            parseInt(
                                                                e.target.value
                                                            ) || 1
                                                        )
                                                    )
                                                }
                                                className="w-12 text-center py-1 border-none focus:outline-none"
                                                aria-label={`Số lượng ${c.name}`}
                                            />
                                            <button
                                                onClick={() => onInc?.(c.id)}
                                                className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-bold"
                                                aria-label={`Tăng số lượng ${c.name}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-right">
                                        <span className="text-lg font-bold text-blue-600">
                                            {toVND(
                                                (c.price || 0) * (c.qty || 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary + Actions (không VAT) */}
                <div className="border-t bg-gray-50 p-6">
                    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                        <div className="flex justify-between items-center text-xl font-bold text-green-700">
                            <span>Tổng cộng:</span>
                            <span>{toVND(total)}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => setPaymentOpen(true)}
                            disabled={cart.length === 0}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
                        >
                            💳 Thanh toán ({toVND(total)})
                        </button>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => onSaveDraft?.()}
                                disabled={cart.length === 0}
                                className="col-span-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                                💾 Lưu đơn
                            </button>
                            <button
                                onClick={onOpenDrafts}
                                className="col-span-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                                📂 Đơn tạm
                            </button>
                            <button
                                onClick={() => onClearAll?.()}
                                className="col-span-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                                🗑️ Xóa tất cả
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setPaymentOpen(false)}
                order={orderData}
                onConfirm={async () => {
                    await onCheckout?.(); // gọi handleCheckout
                    setPaymentOpen(false);
                }}
                onCancel={
                    onCancelOrder
                    // async (reason) => {
                    // if (orderId) {
                    //     console.log("Huỷ order", orderId, "với lý do:", reason);
                    // await onCancelOrder(orderId, reason);
                    // }
                    // setPaymentOpen(false);
                }
                onPrint={() => {
                    console.log("🖨️ In bill cho order:", orderData.id);
                }}
            />
        </>
    );
}
