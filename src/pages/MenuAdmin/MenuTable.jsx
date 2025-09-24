// src/pages/MenuAdmin/MenuTable.jsx
import React from 'react';

export default function MenuTable({ items, formatVND, onEdit, onDelete, onToggleAvailable }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left border-b">Ảnh</th>
            <th className="px-4 py-2 text-left border-b">Tên</th>
            <th className="px-4 py-2 text-left border-b">Danh mục</th>
            <th className="px-4 py-2 text-right border-b">Giá</th>
            <th className="px-4 py-2 text-center border-b">Available</th>
            <th className="px-4 py-2 text-right border-b">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="odd:bg-white even:bg-gray-50">
              <td className="px-4 py-2 border-b">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt={it.name}
                    className="w-12 h-12 object-cover rounded"
                    onError={(ev) => (ev.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500">—</div>
                )}
              </td>
              <td className="px-4 py-2 border-b font-medium">{it.name}</td>
              <td className="px-4 py-2 border-b">{it.category || <span className="text-gray-400">—</span>}</td>
              <td className="px-4 py-2 border-b text-right">{formatVND(it.price)}</td>
              <td className="px-4 py-2 border-b text-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!it.available}
                    onChange={() => onToggleAvailable(it)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-500 rounded-full relative transition"></div>
                </label>
              </td>
              <td className="px-4 py-2 border-b text-right">
                <button
                  onClick={() => onEdit(it)}
                  className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 mr-2"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(it)}
                  className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Xoá
                </button>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                Không có sản phẩm nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
