// src/components/ReceiptPrint.jsx
import React, { useEffect } from 'react';
import { buildVietQRImageURL } from '../utils/vietqr';
import { toVND } from '../utils/money';

// Receipt cho máy in nhiệt 80mm (có thể dùng 58mm, xem CSS @media print phía dưới)
export default function ReceiptPrint({
  open,
  onClose,
  shop = {
    name: 'Cafe POS',
    address: '12 Nguyen Trai, Q.1, TP.HCM',
    phone: '0123 456 789',
  },
  order = {
    code: 'ORD-0001',
    createdAt: Date.now(),
    cashier: 'Admin',
    items: [], // [{ id, name, qty, price }]
    subtotal: 0,
    discount: 0,
    total: 0,
  },
  bank = {
    bankCode: 'TCB',          // Mã bank (VCB/TCB/MB/ACB/...) — chỉnh tuỳ ngân hàng
    accountNumber: '10920123456789', // Số tài khoản nhận
    accountName: 'NGUYEN CONG DAT',
    enableQR: true,
  },
  autoPrint = true, // Gọi window.print khi mở
}) {
  useEffect(() => {
    if (open && autoPrint) {
      // đợi DOM mount rồi in
      const t = setTimeout(() => window.print(), 150);
      // tự đóng sau khi in (tuỳ chọn)
      const onAfterPrint = () => onClose?.();
      window.addEventListener('afterprint', onAfterPrint);
      return () => {
        clearTimeout(t);
        window.removeEventListener('afterprint', onAfterPrint);
      };
    }
  }, [open, autoPrint, onClose]);

  if (!open) return null;

  const dateStr = new Date(order.createdAt).toLocaleString('vi-VN');
  const amount = Math.round(order.total || 0);
  const addInfo = `ORDER#${order.code}`; // nội dung CK: khớp mã đơn

  const qrUrl = bank?.enableQR
    ? buildVietQRImageURL(bank.bankCode, bank.accountNumber, amount, addInfo)
    : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 print:bg-transparent flex items-center justify-center">
      {/* Khung xem trước trên màn hình, khi in sẽ chỉ in phần bên trong .print-area */}
      <div className="bg-white rounded-xl shadow-xl p-4 w-[360px] max-w-[90vw] no-print">
        <div className="text-lg font-semibold mb-3">Xem trước hóa đơn</div>
        <div className="border rounded-lg p-3 max-h-[70vh] overflow-auto">
          <ReceiptInner shop={shop} order={order} bank={bank} qrUrl={qrUrl} />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button className="px-3 py-2 rounded border" onClick={onClose}>Đóng</button>
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => window.print()}>
            In ngay
          </button>
        </div>
      </div>

      {/* Khu vực chỉ dành cho in */}
      <div className="print-area">
        <ReceiptInner shop={shop} order={order} bank={bank} qrUrl={qrUrl} />
      </div>

      {/* Styles in */}
      <style>{`
        @page {
          size: 80mm auto; /* đổi thành 58mm nếu dùng giấy 58mm */
          margin: 2mm;
        }
        @media print {
          .no-print { display: none !important; }
          .print-area { display: block; }
          html, body { background: white; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-area {
          display: none; /* ẩn khi xem màn hình */
          width: 80mm;   /* đổi 58mm nếu cần */
          padding: 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          color: #000;
        }
        .r-center { text-align: center; }
        .r-right { text-align: right; }
        .r-bold { font-weight: 700; }
        .r-sm { font-size: 12px; }
        .r-xs { font-size: 11px; }
        .row { display: flex; justify-content: space-between; gap: 8px; }
        .sep { border-top: 1px dashed #000; margin: 6px 0; }
        .qr { display: flex; align-items: center; justify-content: center; margin-top: 6px; }
        .qr img { width: 180px; height: 180px; object-fit: contain; }
        .item { margin: 6px 0; }
        .item .name { font-weight: 600; }
        .item .meta { display: flex; justify-content: space-between; font-size: 12px; }
      `}</style>
    </div>
  );
}

function ReceiptInner({ shop, order, bank, qrUrl }) {
  const lines = [
    { label: 'Mã đơn', value: order.code },
    { label: 'Thu ngân', value: order.cashier || 'N/A' },
    { label: 'Thời gian', value: new Date(order.createdAt).toLocaleString('vi-VN') },
  ];
  const money = (n) => (typeof n === 'number' ? toVND(n) : toVND(Number(n || 0)));

  return (
    <div style={{ padding: '6px 8px' }}>
      <div className="r-center r-bold" style={{ fontSize: 16 }}>{shop.name}</div>
      {shop.address && <div className="r-center r-sm">{shop.address}</div>}
      {shop.phone && <div className="r-center r-sm">ĐT: {shop.phone}</div>}
      <div className="sep" />

      {lines.map((l) => (
        <div className="row r-sm" key={l.label}>
          <div>{l.label}</div>
          <div>{l.value}</div>
        </div>
      ))}
      <div className="sep" />

      {order.items.map((it) => (
        <div className="item" key={it.id}>
          <div className="name">{it.name}</div>
          <div className="meta">
            <div>x{it.qty} × {money(it.price)}</div>
            <div>{money((it.qty || 0) * (it.price || 0))}</div>
          </div>
        </div>
      ))}

      <div className="sep" />
      <div className="row r-bold">
        <div>Tạm tính</div><div>{money(order.subtotal || order.total)}</div>
      </div>
      {order.discount ? (
        <div className="row">
          <div>Giảm giá</div><div>-{money(order.discount)}</div>
        </div>
      ) : null}
      {order.vat ? (
        <div className="row">
          <div>VAT</div><div>{money(order.vat)}</div>
        </div>
      ) : null}
      <div className="row r-bold" style={{ fontSize: 16 }}>
        <div>Tổng cộng</div><div>{money(order.total)}</div>
      </div>

      {/* QR thanh toán */}
      {bank?.enableQR && qrUrl ? (
        <>
          <div className="sep" />
          <div className="r-center r-bold">Quét QR để thanh toán</div>
          <div className="r-center r-xs">{bank.accountName}</div>
          <div className="r-center r-xs">{bank.bankCode} - STK: {bank.accountNumber}</div>
          <div className="qr">
            <img src={qrUrl} alt="VietQR" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
          <div className="r-center r-xs">Nội dung: ORDER#{order.code}</div>
        </>
      ) : null}

      <div className="sep" />
      <div className="r-center r-sm">Cảm ơn và hẹn gặp lại!</div>
    </div>
  );
}
