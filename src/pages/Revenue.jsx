// src/pages/Revenue.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getRevenue } from "../api";
import { useNavigate } from "react-router-dom";

const formatCurrency = (n) =>
    (n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("vi-VN", { hour12: false });

export default function Revenue() {
    const navigate = useNavigate();

    function handleBack() {
        navigate(-1); 
    }
    const [raw, setRaw] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // Bộ lọc thời gian
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [status, setStatus] = useState("paid"); // mặc định

    // Quick presets
    const setToday = () => {
        const d = new Date();
        const y = d.toISOString().slice(0, 10);
        setFrom(y);
        setTo(y);
    };
    const setLast7 = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        setFrom(start.toISOString().slice(0, 10));
        setTo(end.toISOString().slice(0, 10));
    };
    const setLast30 = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        setFrom(start.toISOString().slice(0, 10));
        setTo(end.toISOString().slice(0, 10));
    };
    const setThisMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setFrom(start.toISOString().slice(0, 10));
        setTo(end.toISOString().slice(0, 10));
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const data = await getRevenue({
                    from: from || undefined,
                    to: to || undefined,
                    status,
                });
                setRaw(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setErr("Không tải được dữ liệu doanh thu.");
            } finally {
                setLoading(false);
            }
        })();
    }, [from, to, status]);

    // Lọc client-side theo from/to
    const filtered = useMemo(() => {
        if (!raw?.length) return [];
        let res = raw;
        if (from) {
            const f = new Date(from + "T00:00:00");
            res = res.filter((o) => new Date(o.createdAt) >= f);
        }
        if (to) {
            const t = new Date(to + "T23:59:59");
            res = res.filter((o) => new Date(o.createdAt) <= t);
        }
        return res;
    }, [raw, from, to]);

    const totalRevenue = useMemo(
        () => filtered.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
        [filtered]
    );
    const orderCount = filtered.length;
    const avgOrder = orderCount ? totalRevenue / orderCount : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
                        onClick={handleBack}
                    >
                        {" "}
                        ⬅️ Quay lại
                    </button>
                    <h1 className="text-2xl font-semibold">📈 Doanh thu</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={setToday}
                        className="px-3 py-1.5 rounded bg-white border hover:bg-gray-50"
                    >
                        Hôm nay
                    </button>
                    <button
                        onClick={setLast7}
                        className="px-3 py-1.5 rounded bg-white border hover:bg-gray-50"
                    >
                        7 ngày
                    </button>
                    <button
                        onClick={setLast30}
                        className="px-3 py-1.5 rounded bg-white border hover:bg-gray-50"
                    >
                        30 ngày
                    </button>
                    <button
                        onClick={setThisMonth}
                        className="px-3 py-1.5 rounded bg-white border hover:bg-gray-50"
                    >
                        Tháng này
                    </button>
                    <div className="ml-4 flex items-center gap-2">
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="px-3 py-1.5 rounded border bg-white"
                        />
                        <span>→</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="px-3 py-1.5 rounded border bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white rounded-xl border">
                    <div className="text-sm text-gray-500">Tổng doanh thu</div>
                    <div className="text-2xl font-semibold mt-1">
                        {formatCurrency(totalRevenue)}
                    </div>
                </div>
                <div className="p-4 bg-white rounded-xl border">
                    <div className="text-sm text-gray-500">Số đơn</div>
                    <div className="text-2xl font-semibold mt-1">
                        {orderCount}
                    </div>
                </div>
                <div className="p-4 bg-white rounded-xl border">
                    <div className="text-sm text-gray-500">TB/đơn</div>
                    <div className="text-2xl font-semibold mt-1">
                        {formatCurrency(avgOrder)}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="font-medium">Danh sách đơn</div>
                    <div className="text-sm text-gray-500">
                        {filtered.length} bản ghi
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 text-gray-500">Đang tải...</div>
                ) : err ? (
                    <div className="p-6 text-red-600">{err}</div>
                ) : (
                    <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-2 border-b">
                                        Order #
                                    </th>
                                    <th className="text-left px-4 py-2 border-b">
                                        Bàn
                                    </th>
                                    <th className="text-left px-4 py-2 border-b">
                                        Thời gian
                                    </th>
                                    <th className="text-right px-4 py-2 border-b">
                                        Số tiền
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((o) => (
                                    <tr
                                        key={o.id}
                                        className="odd:bg-white even:bg-gray-50"
                                    >
                                        <td className="px-4 py-2 border-b">
                                            #{o.id}
                                        </td>
                                        <td className="px-4 py-2 border-b">
                                            {o.table}
                                        </td>
                                        <td className="px-4 py-2 border-b">
                                            {formatDateTime(o.createdAt)}
                                        </td>
                                        <td className="px-4 py-2 border-b text-right font-medium">
                                            {formatCurrency(o.totalAmount)}
                                        </td>
                                    </tr>
                                ))}
                                {!filtered.length && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            Không có dữ liệu trong khoảng đã
                                            chọn.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
