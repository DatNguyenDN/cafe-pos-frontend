// src/components/TablePicker.jsx
import React from "react";

export default function TablePicker({
  open = false,
  tables = [],
  currentTableId,
  onSelect,
  onClose,
  onRefresh,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">Chọn bàn</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              title="Tải lại danh sách bàn"
            >
              🔄 Tải lại
            </button>
            <button
              onClick={onClose}
              className="text-2xl leading-none px-2"
              aria-label="Đóng"
              title="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5">
          {tables.length === 0 ? (
            <div className="text-gray-500 text-center py-10">Chưa có bàn nào</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((t) => {
                const isActive = currentTableId === t.id;
                console.log("Rendering table:", t.name, "Active:", isActive);
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect?.(t)}
                    className={`rounded-xl p-4 border text-left transition-all
                      ${isActive ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-400"}
                      ${t.isAvailable ? "bg-white" : "bg-amber-50"}
                    `}
                    title={`Bàn ${t.name}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">Bàn {t.name}</span>
                      {isActive && <span className="text-blue-600 text-sm font-semibold">Đang chọn</span>}
                    </div>
                    <div className="text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          t.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.isAvailable ? "Trống" : "Đang dùng"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-100">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
