import React, { useState } from "react";
import { toVND } from "../utils/money";
import {  AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { QR_CONFIG } from "../config/qr";
// Hàm tạo URL VietQR
const generateVietQRUrl = (config, amount, description = "Thanh toan don hang") => {
    return `https://img.vietqr.io/image/${config.bankCode}-${config.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(
        description
    )}&accountName=${encodeURIComponent(config.accountName)}`;
};

// const generateVietQRUrl = "https://vietqr.net/generate?bankCode=VCB&accountNumber=1234567890&accountName=NGUYENVANA&amount=100000&description=PaymentForGoods";

export default function PaymentModal({
    isOpen,
    onClose,
    order,
    onConfirm,
    onCancel,
    onPrint,
}) {
    // console.log(
    //     "🚀 ~ file: PaymentModal.jsx:10 ~ PaymentModal ~ order:",
    //     order
    // );
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    // console.log("showCancelConfirm: ", showCancelConfirm);
    const [cancelReason, setCancelReason] = useState("");

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="sm:max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Header */}
                            <DialogHeader>
                                <DialogTitle>
                                    💳 Thanh toán đơn hàng
                                </DialogTitle>
                            </DialogHeader>

                            {/* Body */}
                            {!showCancelConfirm ? (
                                <>
                                    <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
                                        <h4 className="font-semibold text-gray-700 mb-3">
                                            🧾 Chi tiết đơn
                                        </h4>
                                        {order?.items?.map((item) => (
                                            console.log("Rendering item:", item),
                                            <div
                                                key={item.id}
                                                className="flex justify-between items-center border-b py-2 text-gray-700"
                                            >
                                                <span>
                                                    {item.name} × {item.qty}
                                                    {/* {item.menuItem.name} × {item.quantity} */}
                                                </span>
                                                <span className="font-medium">
                                                    {toVND(
                                                        item.price * item.qty
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between text-lg font-bold text-green-700">
                                        <span>Tổng cộng:</span>
                                        <span>{toVND(order?.total || 0)}</span>
                                    </div>

                                    {/* QR Code thanh toán */}
                                    <div className="mt-4 text-center">
                                        <h4 className="font-semibold mb-2">
                                            📲 Quét mã để thanh toán
                                        </h4>
                                        <img
                                            src={generateVietQRUrl(
                                                QR_CONFIG,
                                                order?.total || 0,
                                                `Order-${order?.id}`
                                            )}
                                            
                                            alt="QR thanh toán"
                                            className="mx-auto w-56 h-56 rounded-lg shadow border"
                                        />
                                        <p className="mt-2 text-sm text-gray-600">
                                            {QR_CONFIG.accountName} - {QR_CONFIG.bankCode}  
                                            <br />
                                            STK: {QR_CONFIG.accountNumber}
                                        </p>
                                    </div>


                                    {/* Footer */}
                                    <DialogFooter className="flex flex-col gap-3">
                                        <Button
                                            onClick={onPrint}
                                            className="w-full bg-indigo-500 hover:bg-indigo-600"
                                        >
                                            🖨️ In bill
                                        </Button>
                                        <Button
                                            onClick={onConfirm}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                        >
                                            ✅ Xác nhận thanh toán
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setShowCancelConfirm(true)
                                            }
                                            variant="destructive"
                                            className="w-full"
                                        >
                                            ❌ Huỷ order
                                        </Button>
                                    </DialogFooter>
                                </>
                            ) : (
                                // Confirm cancel UI
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="space-y-4"
                                >
                                    <DialogHeader>
                                        <DialogTitle>
                                            Xác nhận huỷ order?
                                        </DialogTitle>
                                    </DialogHeader>
                                    <p>Vui lòng nhập lý do huỷ:</p>
                                    <Input
                                        value={cancelReason}
                                        onChange={(e) =>
                                            setCancelReason(e.target.value)
                                        }
                                        placeholder="Lý do huỷ..."
                                    />
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setShowCancelConfirm(false)
                                            }
                                        >
                                            Quay lại
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                onCancel(
                                                    order.id,
                                                    cancelReason
                                                ); // ✅ gọi callback
                                                setShowCancelConfirm(false);
                                            }}
                                        >
                                            Xác nhận huỷ
                                        </Button>
                                    </DialogFooter>
                                </motion.div>
                            )}
                        </motion.div>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
