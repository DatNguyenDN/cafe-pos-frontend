// src/pages/POS.jsx
import React, {
    useEffect,
    useMemo,
    useState,
    useRef,
    useCallback,
} from "react";
import ProductGrid from "../components/ProductGrid";
import CartPanel from "../components/CartPanel";
import DraftsModal from "../components/DraftsModal";
import { usePOSDrafts } from "../hooks/usePOSDrafts";
import { parseDecimalToNumber } from "../utils/money";
import TablePicker from "../components/TablePicker";
import {
    fetchProducts,
    createOrder,
    fetchTables,
    updateOrder,
    payOrder,
    getActiveOrderByTable,
    cancelOrder,
} from "../api";
import { Link } from "react-router-dom";
import { hasAdminRole, getToken } from "../utils/auth";
export default function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [tables, setTables] = useState([]);
    const [currentTable, setCurrentTable] = useState(null);
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [orderId, setOrderId] = useState(null);
    // console.log("🚀 ~ file: POS.jsx:26 ~ POS ~ orderId:", orderId);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDrafts, setShowDrafts] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeCategory, setActiveCategory] = useState("Tất cả");

    // Refs để điều phối race condition và tránh stale closure
    const orderIdRef = useRef(orderId);
    const currentTableRef = useRef(currentTable);
    const syncTimerRef = useRef(null);
    const syncSeqRef = useRef(0);
    const tableLoadSeqRef = useRef(0);
    const token = getToken();
    const isAdmin = token && hasAdminRole(token);

    useEffect(() => {
        orderIdRef.current = orderId;
    }, [orderId]);

    useEffect(() => {
        currentTableRef.current = currentTable;
    }, [currentTable]);

    const { drafts, saveDraft, deleteDraft } = usePOSDrafts();

    // Toast helper
    const showToast = useCallback((msg) => {
        setToast(msg);
        const id = setTimeout(() => setToast(null), 1800);
        return () => clearTimeout(id);
    }, []);

    // Fetch products & tables on mount
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [prods, tbls] = await Promise.all([
                    fetchProducts(),
                    fetchTables(),
                ]);
                if (!mounted) return;
                setProducts(prods || []);
                setTables(tbls || []);
            } catch (e) {
                console.error(e);
                showToast("Lỗi tải dữ liệu.");
            }
        })();
        return () => {
            mounted = false;
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        };
    }, [showToast]);

    // Danh mục
    const categoriesUnique = useMemo(() => {
        return Array.from(
            new Set(products.map((p) => p.category).filter(Boolean))
        );
    }, [products]);
    const categories = useMemo(
        () => ["Tất cả", ...categoriesUnique],
        [categoriesUnique]
    );

    useEffect(() => {
        if (!categories.includes(activeCategory)) setActiveCategory("Tất cả");
    }, [categories, activeCategory]);

    // Map nhanh id -> product
    const productsById = useMemo(() => {
        const map = new Map();
        for (const p of products) map.set(Number(p.id), p);
        return map;
    }, [products]);

    // Tổng tiền
    const total = useMemo(
        () =>
            cart.reduce(
                (sum, it) =>
                    sum + parseDecimalToNumber(it.price) * (it.qty || 0),
                0
            ),
        [cart]
    );

    // Chuẩn hóa order item -> cart row
    const mapOrderToCart = useCallback(
        (order) => {
            const rawItems = Array.isArray(order?.items) ? order.items : [];
            return rawItems
                .map((it) => {
                    const menuEntity = it?.menuItem || null;
                    const menuItemId = menuEntity?.id ?? it?.menuItemId;
                    const qty = it?.quantity ?? 0;
                    const priceFromItem =
                        typeof it?.price === "number" ? it.price : null;
                    const product =
                        productsById.get(Number(menuItemId)) || null;

                    const name =
                        menuEntity?.name ??
                        product?.name ??
                        `Món #${menuItemId ?? "?"}`;
                    const price =
                        priceFromItem ??
                        (typeof menuEntity?.price === "number"
                            ? menuEntity.price
                            : null) ??
                        (product ? parseFloat(product.price) : 0);

                    return {
                        id: Number(menuItemId),
                        name,
                        price: Number(price) || 0,
                        qty: Number(qty) || 0,
                    };
                })
                .filter((x) => (x.qty || 0) > 0);
        },
        [productsById]
    );

    // Debounced sync lên server - latest request wins
    const scheduleSync = useCallback(
        (nextCart) => {
            const table = currentTableRef.current;
            if (!table) {
                showToast("Vui lòng chọn bàn trước khi thêm món.");
                setShowTablePicker(true);
                return;
            }
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

            syncTimerRef.current = setTimeout(async () => {
                const seq = ++syncSeqRef.current;
                const items = (nextCart || [])
                    .filter((c) => (c.qty || 0) > 0)
                    .map((c) => ({
                        menuItemId: Number(c.id),
                        quantity: Number(c.qty),
                    }));

                try {
                    const existingOrderId = orderIdRef.current;
                    if (!existingOrderId) {
                        // Tạo order kèm items → không cần updateOrder ngay sau đó
                        const created = await createOrder({
                            tableId: Number(table.id),
                            items,
                        });
                        // Nếu có request mới hơn, bỏ qua kết quả
                        if (seq !== syncSeqRef.current) return;
                        setOrderId(created.id);
                        orderIdRef.current = created.id;
                    } else {
                        await updateOrder(Number(existingOrderId), items);
                        // Local cart là nguồn tin cậy; không cần set snapshot từ server
                    }
                } catch (e) {
                    console.error(e);
                    showToast("Lỗi đồng bộ order. Vui lòng thử lại.");
                }
            }, 250);
        },
        [showToast]
    );

    // Helper cập nhật giỏ hàng + trigger sync
    const updateCart = useCallback(
        (updater) => {
            setCart((prev) => {
                const next =
                    typeof updater === "function" ? updater(prev) : updater;
                scheduleSync(next);
                return next;
            });
        },
        [scheduleSync]
    );

    // Handlers giỏ hàng
    const handleAddToCart = useCallback(
        (item) => {
            if (!currentTableRef.current) {
                showToast("Vui lòng chọn bàn trước.");
                setShowTablePicker(true);
                return;
            }
            updateCart((prev) => {
                const exist = prev.find((x) => x.id === item.id);
                return exist
                    ? prev.map((x) =>
                          x.id === item.id ? { ...x, qty: (x.qty || 0) + 1 } : x
                      )
                    : [
                          ...prev,
                          {
                              ...item,
                              qty: 1,
                              addedAt: new Date().toISOString(),
                          },
                      ];
            });
        },
        [showToast, updateCart]
    );

    const incQty = useCallback(
        (id) => {
            updateCart((prev) =>
                prev.map((x) =>
                    x.id === id ? { ...x, qty: (x.qty || 0) + 1 } : x
                )
            );
        },
        [updateCart]
    );

    const decQty = useCallback(
        (id) => {
            updateCart((prev) =>
                prev.map((x) =>
                    x.id === id
                        ? { ...x, qty: Math.max(1, (x.qty || 1) - 1) }
                        : x
                )
            );
        },
        [updateCart]
    );

    const changeQty = useCallback(
        (id, qty) => {
            const safeQty = Math.max(1, Number(qty) || 1);
            updateCart((prev) =>
                prev.map((x) => (x.id === id ? { ...x, qty: safeQty } : x))
            );
        },
        [updateCart]
    );

    const removeItem = useCallback(
        (id) => {
            updateCart((prev) => prev.filter((x) => x.id !== id));
        },
        [updateCart]
    );

    const clearAll = useCallback(() => {
        updateCart([]);
    }, [updateCart]);

    // Drafts
    const saveCurrentOrder = useCallback(() => {
        if (cart.length === 0)
            return showToast("Giỏ hàng trống, không thể lưu đơn.");
        const draft = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            items: cart,
            total,
        };
        saveDraft(draft);
        setShowDrafts(true);
        showToast("Đã lưu đơn tạm.");
    }, [cart, total, saveDraft, showToast]);

    const restoreDraft = useCallback(
        (id) => {
            const d = drafts.find((x) => x.id === id);
            if (!d) return;
            setCart(d.items || []);
            setShowDrafts(false);
            showToast("Đã khôi phục đơn tạm.");
            // Không auto sync ngay khi khôi phục draft để tránh tạo order ngoài ý muốn
        },
        [drafts, showToast]
    );

    // Checkout
    const handleCheckout = useCallback(async () => {
        if (!orderIdRef.current) {
            showToast("Chưa có order để thanh toán.");
            return;
        }
        try {
            await payOrder(Number(orderIdRef.current));
            showToast(`Đã thanh toán order #${orderIdRef.current}.`);
            setCart([]);
            setOrderId(null);
            orderIdRef.current = null;
            // Cập nhật lại danh sách bàn
            try {
                const tbls = await fetchTables();
                setTables(tbls || []);
            } catch {
                /* ignore */
            }
        } catch (e) {
            console.error(e);
            showToast("Thanh toán thất bại, vui lòng thử lại.");
        }
    }, [showToast]);
    const handleCancelOrder = useCallback(
        async (orderId, reason) => {
            try {
                await cancelOrder(Number(orderIdRef.current), reason); // gọi API huỷ

                setCart([]); // clear giỏ
                setOrderId(null); // reset order
                orderIdRef.current = null;

                // Cập nhật lại danh sách bàn (giống handleCheckout)
                try {
                    const tbls = await fetchTables();
                    // console.log("Tables after cancel:", tbls);
                    setTables(tbls || []);
                } catch {
                    /* ignore */
                }

                showToast(`Đã huỷ order #${orderId}.`);
            } catch (e) {
                console.error("❌ Lỗi huỷ order:", e);
                showToast("Huỷ order thất bại.");
            }
        },
        [showToast]
    );
    // Chọn bàn
    const handleSelectTable = useCallback(
        async (table) => {
            try {
                setCurrentTable(table);
                setShowTablePicker(false);

                const mySeq = ++tableLoadSeqRef.current;
                const active = await getActiveOrderByTable(table.id);

                // Nếu người dùng đã chọn bàn khác trong lúc chờ, bỏ qua kết quả cũ
                if (mySeq !== tableLoadSeqRef.current) return;

                if (active) {
                    setOrderId(active.id);
                    orderIdRef.current = active.id;
                    setCart(mapOrderToCart(active));
                    showToast(
                        `Đang mở order #${active.id} của bàn ${table.name}.`
                    );
                } else {
                    setOrderId(null);
                    orderIdRef.current = null;
                    setCart([]);
                    showToast(
                        `Bàn ${table.name} chưa có order. Hãy thêm món để tạo order mới.`
                    );
                }
            } catch (e) {
                console.error(e);
                showToast("Không thể tải order của bàn.");
            }
        },
        [mapOrderToCart, showToast]
    );

    const refreshTables = useCallback(async () => {
        try {
            const tbls = await fetchTables();
            setTables(tbls || []);
        } catch (e) {
            console.error(e);
            showToast("Lỗi tải danh sách bàn.");
        }
    }, [showToast]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full shadow-lg">
                    {toast}
                </div>
            )}

            {/* Header chọn bàn */}
            <div className="px-6 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTablePicker(true)}
                        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
                    >
                        🍽️ Chọn bàn
                    </button>

                    <div
                        // onClick={() => setShowTablePicker(true)}
                        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
                    >
                        <Link to="/orders">🏷️ Orders</Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/revenue"
                        className="px-3 py-2 rounded-lg bg-white border hover:bg-gray-50"
                    >
                        📈 Doanh thu
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/admin/menu"
                            className="px-3 py-2 rounded-lg bg-white border hover:bg-gray-50"
                        >
                            🛠️ Quản trị Menu
                        </Link>
                    )}
                    <div className="text-sm">
                        {currentTable ? (
                            <span>
                                Bàn <b>{currentTable.name}</b>
                                {orderId ? (
                                    <>
                                        {" "}
                                        • Order <b>#{orderId}</b>
                                    </>
                                ) : (
                                    " • chưa có order"
                                )}
                            </span>
                        ) : (
                            <span className="text-gray-500">Chưa chọn bàn</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 h-screen gap-6 p-6">
                {/* Panel sản phẩm */}
                <div className="col-span-12 lg:col-span-8">
                    <ProductGrid
                        products={products}
                        categories={categories}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onAddToCart={handleAddToCart}
                    />
                </div>

                {/* Panel giỏ hàng */}
                <div className="col-span-12 lg:col-span-4">
                    <CartPanel
                        orderId={orderId}
                        cart={cart}
                        total={total}
                        onInc={incQty}
                        onDec={decQty}
                        onChangeQty={changeQty}
                        onRemove={removeItem}
                        onCheckout={handleCheckout}
                        onCancelOrder={handleCancelOrder}
                        onClearAll={clearAll}
                        onSaveDraft={saveCurrentOrder}
                        onOpenDrafts={() => setShowDrafts(true)}
                        draftsCount={drafts.length}
                    />
                </div>
            </div>

            <TablePicker
                open={showTablePicker}
                tables={tables}
                currentTableId={currentTable?.id}
                onSelect={handleSelectTable}
                onClose={() => setShowTablePicker(false)}
                onRefresh={refreshTables}
            />

            {/* Modal Đơn tạm */}
            <DraftsModal
                open={showDrafts}
                onClose={() => setShowDrafts(false)}
                drafts={drafts}
                onRestore={restoreDraft}
                onDelete={(id) => deleteDraft(id)}
            />
        </div>
    );
}
