import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeText } from "../utils/text";
import { toVND, parseDecimalToNumber } from "../utils/money";

export default function ProductGrid({
    products,
    categories,
    activeCategory,
    onCategoryChange,
    searchTerm,
    onSearchChange,
    onAddToCart,
}) {
    // Indicator effect for tabs
    const tabsRef = useRef([]);
    const containerRef = useRef(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const idx = categories.findIndex((c) => c === activeCategory);
        const el = tabsRef.current[idx];
        const parent = containerRef.current;
        if (el && parent) {
            const parentRect = parent.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            setIndicatorStyle({
                left: rect.left - parentRect.left,
                width: rect.width,
            });
        }
    }, [activeCategory, categories]);

    // Filtered products: category + search (accent-insensitive)
    const filteredProducts = useMemo(() => {
        const s = normalizeText(searchTerm.trim());
        return products
            .filter((p) => p?.available === true) // chỉ lấy sản phẩm đang mở bán
            .filter((p) => {
                const matchCat =
                    !activeCategory ||
                    activeCategory === "Tất cả" ||
                    p.category === activeCategory;
                if (!matchCat) return false;
                if (!s) return true;
                const name = normalizeText(p.name || "");
                return name.includes(s);
            });
    }, [products, activeCategory, searchTerm]);

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Header: search + tabs */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        🛍️ Danh sách sản phẩm
                    </h2>

                    {/* Search box */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder="Tìm kiếm theo tên sản phẩm..."
                            className="px-4 py-2 rounded-xl text-gray-900 w-72 md:w-80 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => onSearchChange?.("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 bg-white/70 rounded-full w-6 h-6 flex items-center justify-center"
                                title="Xoá tìm kiếm"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Category tabs + indicator */}
                <div className="relative" ref={containerRef}>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map((cat, idx) => (
                            <button
                                key={cat}
                                ref={(el) => (tabsRef.current[idx] = el)}
                                onClick={() => onCategoryChange?.(cat)}
                                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                                    activeCategory === cat
                                        ? "bg-white text-blue-700 shadow-lg scale-105"
                                        : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <span
                        className="absolute h-1 bg-white rounded-full bottom-0 transition-all duration-300"
                        style={{
                            left: indicatorStyle.left,
                            width: indicatorStyle.width,
                        }}
                    />
                </div>
            </div>

            {/* Grid sản phẩm */}
            <div className="p-6 overflow-y-auto h-full">
                <div className="text-sm text-gray-500 mb-3">
                    {filteredProducts.length} sản phẩm
                    {searchTerm ? ` cho từ khóa “${searchTerm}”` : ""}
                </div>

                <div
                    key={activeCategory + "|" + (searchTerm ? "s" : "")}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity duration-300"
                >
                    {filteredProducts.map((p) => (
                        <div
                            key={p.id}
                            className="group bg-white border-2 border-gray-100 rounded-2xl p-4 cursor-pointer 
                         hover:border-blue-400 hover:shadow-xl transform hover:-translate-y-2 
                         transition-all duration-300 active:scale-95"
                            onClick={() =>
                                onAddToCart?.({
                                    id: p.id,
                                    name: p.name,
                                    price: parseDecimalToNumber(p.price),
                                    imageUrl: p.imageUrl || null, // TRUYỀN ẢNH VÀO GIỎ
                                    addedAt: Date.now(),
                                })
                            }
                        >
                            {/* THAY KHỐI ẢNH */}
                            <div className="rounded-xl h-28 mb-3 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                {p.imageUrl ? (
                                    <img
                                        src={p.imageUrl}
                                        alt={p.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Ẩn ảnh lỗi và hiện fallback emoji
                                            e.currentTarget.style.display =
                                                "none";
                                            const fallback =
                                                e.currentTarget.parentElement?.querySelector(
                                                    ".fallback-emoji"
                                                );
                                            if (fallback)
                                                fallback.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="fallback-emoji text-3xl"
                                    style={{
                                        display: p.imageUrl ? "none" : "flex",
                                    }}
                                >
                                    🧃
                                </div>
                            </div>
                            <div className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 line-clamp-2">
                                {p.name}
                            </div>
                            <div className="text-lg font-bold text-green-600">
                                {toVND(p.price)}
                            </div>
                            <button
                                className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 
                                 text-white py-2 rounded-xl opacity-0 group-hover:opacity-100 
                                 transition-all duration-300 font-semibold"
                            >
                                + Thêm vào giỏ
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
