import React, { useState } from "react";
import { updateOrder } from "../api"; // import đúng từ api/index.js

export default function EditOrderModal({ order, onClose, onSaved }) {
  const [items, setItems] = useState(order.items.map(i => ({ ...i })));
  const [saving, setSaving] = useState(false);

  function updateQty(idx, delta) {
    setItems(prev =>
      prev.map((it, i) =>
        i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
      )
    );
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function addItem() {
    setItems(prev => [
      ...prev,
      {
        menuItem: { id: Date.now(), name: "New item", price: 10000 },
        quantity: 1,
        price: 10000,
      },
    ]);
  }

  const total = items.reduce((s, it) => s + it.quantity * it.price, 0);

  async function save() {
    setSaving(true);
    try {
      // chuẩn hóa payload cho BE
      const payloadItems = items.map(it => ({
        menuItemId: it.menuItem.id,
        quantity: it.quantity,
      }));

      await updateOrder(order.id, payloadItems);

      onSaved();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90%] max-w-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Edit Order - Bàn {order.tableName}
          </h3>
          <button onClick={onClose} className="text-slate-500">
            ✖
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                value={it.menuItem.name}
                onChange={e =>
                  setItems(prev =>
                    prev.map((p, i) =>
                      i === idx
                        ? {
                            ...p,
                            menuItem: { ...p.menuItem, name: e.target.value },
                          }
                        : p
                    )
                  )
                }
                className="flex-1 border rounded px-2 py-1"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(idx, -1)}
                  className="px-2 border rounded"
                >
                  -
                </button>
                <div className="w-8 text-center">{it.quantity}</div>
                <button
                  onClick={() => updateQty(idx, +1)}
                  className="px-2 border rounded"
                >
                  +
                </button>
              </div>
              <div className="w-24 text-right">
                {it.price.toLocaleString()}₫
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
          ))}

          <div>
            <button
              onClick={addItem}
              className="px-3 py-1 border rounded"
            >
              + Add item
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-sm text-slate-600">
              Tổng: <strong>{total.toLocaleString()}₫</strong>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-3 py-1 border rounded">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
