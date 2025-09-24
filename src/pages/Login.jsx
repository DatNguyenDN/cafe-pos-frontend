import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login({ email, password });
            const token = res.access_token;
            if (!token) throw new Error("No access_token in response");

            localStorage.setItem("token", token);
            localStorage.setItem(
                "user",
                JSON.stringify({
                    email,
                    role: res?.role || null,
                })
            );
            if (res?.role === "admin") nav("/admin/menu", { replace: true });
            else nav("/pos", { replace: true });
        } catch (err) {
            alert(err?.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white p-6 rounded shadow"
            >
                <h2 className="text-2xl font-semibold mb-4">
                    Đăng nhập - Cafe POS
                </h2>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full mb-3 p-2 border rounded"
                />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    type="password"
                    className="w-full mb-3 p-2 border rounded"
                />
                <button
                    type="submit"
                    className="w-full p-2 bg-slate-800 text-white rounded"
                    disabled={loading}
                >
                    {loading ? "Đang..." : "Đăng nhập"}
                </button>
            </form>
        </div>
    );
}
