// src/pages/MenuAdmin/MenuFormModal.jsx
import React, { useEffect, useState } from 'react';

export default function MenuFormModal({
  open,
  initial,
  onClose,
  onSubmit,
  saving,
  categories = [],
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(''); // string để hỗ trợ nhập 10.5
  const [category, setCategory] = useState('');
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name || '');
      setPrice(String(initial.price ?? ''));
      setCategory(initial.category || '');
      setAvailable(Boolean(initial.available));
      setImageUrl(initial.imageUrl || '');
    } else {
      setName('');
      setPrice('');
      setCategory('');
      setAvailable(true);
      setImageUrl('');
    }
  }, [initial, open]);

  if (!open) return null;

  const handleSave = (e) => {
    e?.preventDefault?.();
    const nameTrim = name.trim();
    const priceNum = Number(parseFloat(price));
    if (!nameTrim) return alert('Tên sản phẩm là bắt buộc.');
    if (!Number.isFinite(priceNum) || priceNum <= 0) return alert('Giá phải là số > 0.');

    const payload = {
      name: nameTrim,
      price: Math.round(priceNum * 100) / 100, // 2 chữ số thập phân
      category: category.trim() || null, // cho phép gõ mới hoặc chọn gợi ý
      available: Boolean(available),
      imageUrl: imageUrl.trim() || null,
    };
    onSubmit?.(payload);
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border w-[520px] max-w-[95vw] p-5 shadow-xl"
        onClick={stop}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            {initial ? 'Sửa món' : 'Thêm món'}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        <form className="grid grid-cols-1 gap-3" onSubmit={handleSave}>
          <div>
            <label className="text-sm text-gray-600">Tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-white"
              placeholder="Tên món"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Giá (VND)</label>
            <input
              type="number"
              step="10000"
              min="10000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-white"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Danh mục</label>
            <input
              list="category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-white"
              placeholder="Chọn hoặc nhập danh mục mới"
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              Gõ để tạo danh mục mới hoặc chọn từ gợi ý.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Trạng thái</label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={available}
                onChange={() => setAvailable((v) => !v)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-500 rounded-full relative transition" />
              <span className="ml-3 text-sm">
                {available ? 'Available' : 'Unavailable'}
              </span>
            </label>
          </div>

          <div>
            <label className="text-sm text-gray-600">Ảnh (Image URL)</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-white"
              placeholder="https://..."
            />
            {imageUrl ? (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded border"
                  onError={(ev) => (ev.currentTarget.style.display = 'none')}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
