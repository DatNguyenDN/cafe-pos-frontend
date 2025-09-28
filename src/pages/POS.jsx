// src/pages/POS.jsx
import React, {
    useEffect,
    useMemo,
    useState,
    useRef,
    useCallback,
} from "react";
import { Link } from "react-router-dom";
import ProductGrid from "../components/ProductGrid";
import CartPanel from "../components/CartPanel";
import DraftsModal from "../components/DraftsModal";
import TablePicker from "../components/TablePicker";
import { parseDecimalToNumber } from "../utils/money";
import { usePOSDrafts } from "../hooks/usePOSDrafts";
import { supabase } from "../lib/supabase";
import { getUser, hasAdminRole, cancelOrder, updateOrder } from "../api";


export default function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [tables, setTables] = useState([]);
    const [currentTable, setCurrentTable] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [showDrafts, setShowDrafts] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("Tất cả");

    const orderIdRef = useRef(orderId);
    const currentTableRef = useRef(currentTable);
    const syncTimerRef = useRef(null);
    const syncSeqRef = useRef(0);
    const tableLoadSeqRef = useRef(0);

    const user = getUser();
    const isAdmin = hasAdminRole();

    useEffect(() => {
        orderIdRef.current = orderId;
    }, [orderId]);
    useEffect(() => {
        currentTableRef.current = currentTable;
    }, [currentTable]);

    const { drafts, saveDraft, deleteDraft } = usePOSDrafts();

    const showToast = useCallback((msg) => {
        setToast(msg);
        const id = setTimeout(() => setToast(null), 1800);
        return () => clearTimeout(id);
    }, []);

    // fetch products + tables
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [
                    { data: prods, error: pErr },
                    { data: tbls, error: tErr },
                ] = await Promise.all([
                    supabase
                        .from("menu_items")
                        .select("*")
                        .eq("available", true),
                    supabase.from("table").select("*"),
                ]);
                if (!mounted) return;
                if (pErr) throw pErr;
                if (tErr) throw tErr;
                setProducts(prods || []);
                setTables(tbls || []);
            } catch (e) {
                console.error("Load init data", e);
                showToast("Lỗi tải dữ liệu.");
            }
        })();
        return () => {
            mounted = false;
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        };
    }, [showToast]);

    const categoriesUnique = useMemo(
        () =>
            Array.from(
                new Set(products.map((p) => p.category).filter(Boolean))
            ),
        [products]
    );
    const categories = useMemo(
        () => ["Tất cả", ...categoriesUnique],
        [categoriesUnique]
    );
    useEffect(() => {
        if (!categories.includes(activeCategory)) setActiveCategory("Tất cả");
    }, [categories, activeCategory]);

    const productsById = useMemo(() => {
        const m = new Map();
        products.forEach((p) => m.set(Number(p.id), p));
        return m;
    }, [products]);

    const total = useMemo(
        () =>
            cart.reduce(
                (s, it) => s + parseDecimalToNumber(it.price) * (it.qty || 0),
                0
            ),
        [cart]
    );

    const mapOrderToCart = useCallback(
        (order, items) => {
            // order: order row, items: order_item rows
            const rawItems = Array.isArray(items) ? items : [];
            return rawItems
                .map((it) => {
                    const product =
                        productsById.get(Number(it.menuItemId)) || null;
                    return {
                        id: Number(it.menuItemId),
                        name: product?.name || `Món #${it.menuItemId}`,
                        price: Number(it.price ?? product?.price ?? 0),
                        qty: Number(it.quantity || 0),
                        addedAt: it.createdAt ?? undefined,
                    };
                })
                .filter((x) => (x.qty || 0) > 0);
        },
        [productsById]
    );

    // scheduleSync: debounce write to supabase
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
                        price: Number(c.price || 0),
                    }));

                try {
                    const existingOrderId = orderIdRef.current;
                    if (!existingOrderId) {
                        // create order row
                        const { data: insertedOrder, error: insertErr } =
                            await supabase
                                .from("order")
                                .insert([
                                    {
                                        tableId: Number(table.id),
                                        status: "PENDING",
                                        total: 0,
                                    },
                                ])
                                .select()
                                .single();
                        if (insertErr) throw insertErr;
                        // insert order items
                        const payloadItems = items.map((it) => ({
                            orderId: insertedOrder.id,
                            menuItemId: it.menuItemId,
                            quantity: it.quantity,
                            price: it.price,
                        }));
                        const { error: itemsErr } = await supabase
                            .from("order_item")
                            .insert(payloadItems);
                        if (itemsErr) throw itemsErr;

                        // compute total and update order
                        const newTotal = payloadItems.reduce(
                            (s, it) =>
                                s +
                                Number(it.price || 0) *
                                    Number(it.quantity || 0),
                            0
                        );
                        await supabase
                            .from("order")
                            .update({ total: newTotal })
                            .eq("id", insertedOrder.id);

                        if (seq !== syncSeqRef.current) return;
                        setOrderId(insertedOrder.id);
                        orderIdRef.current = insertedOrder.id;
                    } else {
                        if (items.length === 0) {
                            // chỉ cập nhật total = 0, giữ status pending
                            await updateOrder(Number(existingOrderId), []);
                        } else {
                            await updateOrder(Number(existingOrderId), items);
                        }
                    }
                } catch (e) {
                    console.error("Sync order error", e);
                    showToast("Lỗi đồng bộ order. Vui lòng thử lại.");
                }
            }, 250);
        },
        [showToast]
    );

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

    // cart handlers
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
        [updateCart, showToast]
    );

    const incQty = useCallback(
        (id) =>
            updateCart((prev) =>
                prev.map((x) =>
                    x.id === id ? { ...x, qty: (x.qty || 0) + 1 } : x
                )
            ),
        [updateCart]
    );
    const decQty = useCallback(
        (id) =>
            updateCart((prev) =>
                prev.map((x) =>
                    x.id === id
                        ? { ...x, qty: Math.max(1, (x.qty || 1) - 1) }
                        : x
                )
            ),
        [updateCart]
    );
    const changeQty = useCallback(
        (id, qty) =>
            updateCart((prev) =>
                prev.map((x) =>
                    x.id === id
                        ? { ...x, qty: Math.max(1, Number(qty) || 1) }
                        : x
                )
            ),
        [updateCart]
    );
    const removeItem = useCallback(
        (id) => updateCart((prev) => prev.filter((x) => x.id !== id)),
        [updateCart]
    );
    // const clearAll = useCallback(() => updateCart([]), [updateCart]);
    const clearAll = useCallback(() => {
        // Nếu chưa có order thì chỉ clear local cart
        if (!orderIdRef.current) {
            setCart([]); // hoặc updateCart([])
            return;
        }

        // Nếu có order trên server -> confirm trước khi huỷ
        if (!confirm("Xác nhận huỷ order và giải phóng bàn?")) return;

        (async () => {
            try {
                await cancelOrder(
                    Number(orderIdRef.current),
                    "Huỷ bởi nhân viên"
                );
                setCart([]);
                setOrderId(null);
                orderIdRef.current = null;
                showToast("Đã huỷ order.");
                // refresh tables nếu cần
                const { data: tbls, error: tblErr } = await supabase
                    .from("table")
                    .select("*");
                if (!tblErr) setTables(tbls || []);
            } catch (e) {
                console.error("Cancel order failed", e);
                showToast("Huỷ order thất bại.");
            }
        })();
    }, [showToast]);

    // drafts
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
        },
        [drafts, showToast]
    );

    // checkout
    const handleCheckout = useCallback(async () => {
        if (!orderIdRef.current) {
            showToast("Chưa có order để thanh toán.");
            return;
        }
        try {
            await supabase
                .from("order")
                .update({ status: "PAID", updateAt: new Date().toISOString() })
                .eq("id", orderIdRef.current);
            showToast(`Đã thanh toán order #${orderIdRef.current}.`);
            setCart([]);
            setOrderId(null);
            orderIdRef.current = null;
            // refresh tables
            const { data: tbls } = await supabase.from("table").select("*");
            setTables(tbls || []);
        } catch (e) {
            console.error("Checkout error", e);
            showToast("Thanh toán thất bại, vui lòng thử lại.");
        }
    }, [showToast]);

    const handleCancelOrder = useCallback(
        async (orderIdParam, reason) => {
            if (!orderIdRef.current) {
                showToast("Chưa có order để huỷ.");
                return;
            }
            try {
                await supabase
                    .from("order")
                    .update({
                        status: "CANCELLED",
                        cancelReason: reason,
                        cancelledAt: new Date().toISOString(),
                    })
                    .eq("id", orderIdRef.current);
                // optionally delete items or keep for history
                setCart([]);
                setOrderId(null);
                orderIdRef.current = null;
                const { data: tbls } = await supabase.from("table").select("*");
                setTables(tbls || []);
                showToast(`Đã huỷ order #${orderIdParam}.`);
            } catch (e) {
                console.error("Cancel order error", e);
                showToast("Huỷ order thất bại.");
            }
        },
        [showToast]
    );

    // select table: load pending order items
    const handleSelectTable = useCallback(
        async (table) => {
            try {
                setCurrentTable(table);
                setShowTablePicker(false);
                const mySeq = ++tableLoadSeqRef.current;

                const { data: orderRow, error: orderErr } = await supabase
                    .from("order")
                    .select("*")
                    .eq("tableId", table.id)
                    .eq("status", "PENDING") // ✅ chỉ lấy pending
                    .order("createdAt", { ascending: true })
                    .limit(1)
                    .maybeSingle(); // thay .single() → .maybeSingle() để ko throw khi không có dòng nào

                if (mySeq !== tableLoadSeqRef.current) return;

                if (orderErr) throw orderErr;

                if (orderRow) {
                    // fetch order items
                    const { data: items, error: itemsErr } = await supabase
                        .from("order_item")
                        .select("*")
                        .eq("orderId", orderRow.id);

                    if (itemsErr) throw itemsErr;

                    setOrderId(orderRow.id);
                    orderIdRef.current = orderRow.id;
                    setCart(mapOrderToCart(orderRow, items));
                    showToast(
                        `Đang mở order #${orderRow.id} của bàn ${table.name}.`
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
                console.error("Select table error", e);
                showToast("Không thể tải order của bàn.");
            }
        },
        [mapOrderToCart, showToast]
    );

    const refreshTables = useCallback(async () => {
        try {
            const { data: tbls, error } = await supabase
                .from("table")
                .select("*");
            if (error) throw error;
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

            {/* Header */}
            <div className="px-6 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTablePicker(true)}
                        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
                    >
                        🍽️ Chọn bàn
                    </button>
                    <div className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50">
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
