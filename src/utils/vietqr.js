// src/utils/vietqr.js
// bankCode: mã ngân hàng (VD: vietcombank: "VCB", techcombank: "TCB", mbbank: "MB")
// accountNumber: số tài khoản thụ hưởng (string)
// amount: số tiền VND (integer)
// addInfo: nội dung chuyển khoản (VD: ORDER#1234)
export function buildVietQRImageURL(bankCode, accountNumber, amount, addInfo) {
  const bank = String(bankCode || '').trim();
  const acc = String(accountNumber || '').trim();
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  const info = encodeURIComponent(addInfo || '');
  // Ảnh QR tĩnh từ VietQR (phổ biến); nếu muốn logo, đổi "-qr_only.png" thành "-logo.png"
  return `https://img.vietqr.io/image/${bank}-${acc}-qr_only.png?amount=${amt}&addInfo=${info}`;
}
