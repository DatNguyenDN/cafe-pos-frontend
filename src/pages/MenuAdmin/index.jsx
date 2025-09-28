// src/pages/MenuAdmin/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    fetchProducts,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
} from "../../api";
import MenuTable from "./MenuTable";
import MenuFormModal from "./MenuFormModal";
import { categoriesFromItems, formatVND } from "../../utils/money";
import { useNavigate } from "react-router-dom";

export default function MenuAdminPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("Tất cả");

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null); // item đang sửa
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState(null);
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1800);
    };

    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const data = await fetchProducts();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setErr("Không tải được danh sách menu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Danh mục cho filter (có “Tất cả”)
    const categoriesForFilter = useMemo(
        () => ["Tất cả", ...categoriesFromItems(items)],
        [items]
    );

    // Danh mục cho Form (chỉ danh mục thực)
    const categoriesForForm = useMemo(
        () => categoriesFromItems(items),
        [items]
    );

    const filtered = useMemo(() => {
        let list = items;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((x) => x.name?.toLowerCase().includes(q));
        }
        if (categoryFilter !== "Tất cả") {
            list = list.filter((x) => x.category === categoryFilter);
        }
        return list;
    }, [items, search, categoryFilter]);

    const openCreate = () => {
        setEditing(null);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setShowForm(true);
    };

    const handleSave = async (payload) => {
        setSaving(true);
        try {
            if (editing) {
                await updateMenuItem(editing.id, payload);
                // Re-fetch để chắc 100% đồng bộ server (tránh sai khác)
                await load();
                showToast("Đã cập nhật sản phẩm.");
            } else {
                await createMenuItem(payload);
                // Re-fetch để khi F5 vẫn còn vì data đến từ BE
                await load();
                showToast("Đã tạo sản phẩm.");
            }
            setShowForm(false);
            setEditing(null);
        } catch (e) {
            console.error(e);
            const status = e?.response?.status;
            if (status === 401)
                showToast("Bạn cần đăng nhập (JWT) để thực hiện thao tác này.");
            else showToast("Lưu thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Xoá "${item.name}"?`)) return;
        try {
            await deleteMenuItem(item.id);
            setItems((prev) => prev.filter((x) => x.id !== item.id));
            showToast("Đã xoá sản phẩm.");
        } catch (e) {
            console.error(e);
            const status = e?.response?.status;
            if (status === 401)
                showToast("Bạn cần đăng nhập (JWT) để thực hiện thao tác này.");
            else showToast("Xoá thất bại. Vui lòng thử lại.");
        }
    };

    const handleToggleAvailable = async (item) => {
        try {
            const updated = await updateMenuItem(item.id, {
                available: !item.available,
            });
            setItems((prev) =>
                prev.map((x) => (x.id === item.id ? updated : x))
            );
        } catch (e) {
            console.error(e);
            const status = e?.response?.status;
            if (status === 401)
                showToast("Bạn cần đăng nhập (JWT) để thực hiện thao tác này.");
            else showToast("Không thể cập nhật trạng thái.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full shadow-lg">
                    {toast}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
                        onClick={() => navigate("/pos")}
                    >
                        {" "}
                        ⬅️ Quay lại
                    </button>
                    <h1 className="text-2xl font-semibold">🧾 Quản trị Menu</h1>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên..."
                        className="px-3 py-2 rounded-lg border bg-white w-64"
                    />
                    <select
                        className="px-3 py-2 rounded-lg border bg-white"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {categoriesForFilter.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        ➕ Thêm món
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="font-medium">Danh sách món</div>
                    <div className="text-sm text-gray-500">
                        {filtered.length} sản phẩm
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 text-gray-500">Đang tải...</div>
                ) : err ? (
                    <div className="p-6 text-red-600">{err}</div>
                ) : (
                    <MenuTable
                        items={filtered}
                        formatVND={formatVND}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onToggleAvailable={handleToggleAvailable}
                    />
                )}
            </div>

            <MenuFormModal
                open={showForm}
                initial={editing}
                onClose={() => {
                    setShowForm(false);
                    setEditing(null);
                }}
                onSubmit={handleSave}
                saving={saving}
                categories={categoriesForForm} // TRUYỀN CATEGORY XUỐNG FORM
            />
        </div>
    );
}
