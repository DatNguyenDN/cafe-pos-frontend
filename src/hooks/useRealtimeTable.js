import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Hook lắng nghe thay đổi bảng `table` theo realtime.
 * 
 * @param {boolean} active - Khi true thì bật subscription (ví dụ khi mở TablePicker).
 * @param {Function} setTables - Hàm cập nhật state tables (từ POS.jsx).
 * @param {Function} refreshTables - Hàm load lại toàn bộ danh sách bàn ban đầu.
 */
export function useRealtimeTables(active, setTables, refreshTables) {
  useEffect(() => {
    if (!active) return;

    // load dữ liệu mới nhất khi modal mở
    refreshTables();

    // subscribe realtime
    const channel = supabase
      .channel("table-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table" },
        (payload) => {
          setTables((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((t) =>
                t.id === payload.new.id ? payload.new : t
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [active, refreshTables, setTables]);
}
