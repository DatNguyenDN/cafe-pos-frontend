import React from "react";
export default function Cart({ items, onCheckout, onChange }) {
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    function setQty(idx, qty) {
        const copy = [...items];
        copy[idx].qty = qty;
        onChange(copy);
    }
    function remove(idx) {
        const copy = [...items];
        copy.splice(idx, 1);
        onChange(copy);
    }
    return (
        <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Giỏ hàng</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
                {items.map((it, idx) => (
                    <div
                        key={it.id}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-sm text-gray-500">
                                {it.price?.toLocaleString()} đ x {it.qty}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setQty(idx, Math.max(1, it.qty - 1))
                                }
                                className="px-2"
                            >
                                -
                            </button>
                            <div>{it.qty}</div>
                            <button
                                onClick={() => setQty(idx, it.qty + 1)}
                                className="px-2"
                            >
                                +
                            </button>
                            <button
                                onClick={() => remove(idx)}
                                className="px-2 text-red-500"
                            >
                                x
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4">
                <div className="font-bold text-lg">
                    Tổng: {total.toLocaleString()} đ
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                        onClick={() =>
                            onCheckout({ method: "cash", amount: total })
                        }
                        className="p-2 rounded border"
                    >
                        Thanh toán tiền mặt
                    </button>
                    <button
                        onClick={() =>
                            onCheckout({ method: "card", amount: total })
                        }
                        className="p-2 rounded border"
                    >
                        Thanh toán thẻ
                    </button>
                </div>
            </div>
        </div>
    );
}
