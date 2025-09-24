import React from "react";
export default function Dashboard() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow">
                    Total revenue (placeholder)
                </div>
                <div className="p-4 bg-white rounded shadow">Top products</div>
                <div className="p-4 bg-white rounded shadow">Sales by hour</div>
            </div>
        </div>
    );
}
