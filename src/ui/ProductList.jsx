import React from "react";
export default function ProductList({ products, onAdd }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {products.map((p) => (
                <div
                    key={p.id}
                    className="p-3 bg-white rounded shadow flex flex-col"
                >
                    <div className="flex-1">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-600">{p.sku}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="font-bold">
                            {p.price?.toLocaleString()} đ
                        </div>
                        <button
                            onClick={() => onAdd(p)}
                            className="px-3 py-1 border rounded"
                        >
                            Thêm
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
