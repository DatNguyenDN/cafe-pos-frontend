import { supabase } from "../lib/supabase";

// ===== Auth =====
export const login = async ({ email, password }) => {
    // trim email để tránh khoảng trắng thừa
    email = email.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Supabase login error:", error);
        throw new Error(error.message);
    }

    // lấy user id từ Auth
    const authUser = data.user;
    if (!authUser) throw new Error("User not found");

    // query bảng users để lấy role
    const { data: userProfile, error: profileError } = await supabase
        .from("user")
        .select("*")
        .eq("id", authUser.id)
        .single();

    if (profileError || !userProfile) {
        throw new Error("User profile not found in database");
    }

    // lưu token + user info
    localStorage.setItem("token", data.session?.access_token || "");
    localStorage.setItem("user", JSON.stringify(userProfile));

    return userProfile;
};

// Hàm lấy user từ localStorage
export const getUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
};

// kiểm tra token còn hợp lệ (có tồn tại)
export const isTokenValid = (token) => !!token;

// kiểm tra role admin
export const hasAdminRole = () => {
    const user = getUser();
    return user?.role === "admin";
};

// ===== Menu / Products =====
export const fetchProducts = async () => {
    const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true);
    if (error) throw error;
    return data;
};

export const createMenuItem = async (item) => {
    const { data, error } = await supabase.from("menu").insert([item]).select();
    if (error) throw error;
    return data[0];
};

export const updateMenuItem = async (id, updates) => {
    const { data, error } = await supabase
        .from("menu")
        .update(updates)
        .eq("id", id)
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteMenuItem = async (id) => {
    const { error } = await supabase.from("menu").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
};

// ===== Tables =====
export const fetchTables = async () => {
    const { data, error } = await supabase.from("table").select("*");
    if (error) throw error;
    return data;
};

export const getTable = async (id) => {
    const { data, error } = await supabase
        .from("table")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw error;
    return data;
};

export const createTable = async (name) => {
    const { data, error } = await supabase
        .from("table")
        .insert([{ name, isAvailable: true }])
        .select();
    if (error) throw error;
    return data[0];
};

export const setTableAvailability = async (id, isAvailable) => {
    const { data, error } = await supabase
        .from("table")
        .update({ isAvailable })
        .eq("id", id)
        .select();
    if (error) throw error;
    return data[0];
};

// ===== Orders =====
export const fetchOrdersByTable = async (tableId) => {
    const { data, error } = await supabase
        .from("order")
        .select("*")
        .eq("tableId", tableId);
    if (error) throw error;
    return data;
};

export const fetchOrders = async () => {
    const { data, error } = await supabase
        .from("order")
        .select(
            `
      *,
      order_item (
        id,
        quantity,
        price,
        menu_items (
          id,
          name,
          price,
          category,
          imageUrl
        )
      ),
      table (*)
    `
        )
        .order("createdAt", { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createOrder = async ({ tableId, items }) => {
    const { data, error } = await supabase
        .from("order")
        .insert([
            {
                tableId,
                status: "PENDIN", // ✅ dùng enum đúng
                total: 0, // ban đầu = 0
            },
        ])
        .select()
        .single();

    if (error) throw error;
    const order = data;

    // lưu order_item
    if (items?.length) {
        const { error: itemError } = await supabase.from("order_item").insert(
            items.map((it) => ({
                orderId: order.id,
                menuItemId: it.menuItemId,
                quantity: it.quantity,
                price: it.price ?? 0,
            }))
        );
        if (itemError) throw itemError;
    }

    // set table busy
    await supabase
        .from("table")
        .update({ isAvailable: false })
        .eq("id", tableId);

    return order;
};

export const updateOrder = async (orderId, items) => {
    // xóa items cũ
    const { error: delErr } = await supabase
        .from("order_item")
        .delete()
        .eq("orderId", orderId);
    if (delErr) throw delErr;

    // Nếu items rỗng -> chỉ set total = 0 (KEEP status as-is, do NOT CANCEL)
    if (!items || items.length === 0) {
        const { data: updatedOrder, error: updErr } = await supabase
            .from("order")
            .update({ total: 0 })
            .eq("id", orderId)
            .select()
            .single();
        if (updErr) throw updErr;
        return updatedOrder;
    }

    // chèn items mới
    const payload = items.map((it) => ({
        orderId,
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        price: it.price ?? 0,
    }));
    const { error: insertErr } = await supabase
        .from("order_item")
        .insert(payload);
    if (insertErr) throw insertErr;

    // tính lại tổng
    const { data: orderItems, error: itemsErr } = await supabase
        .from("order_item")
        .select("price, quantity")
        .eq("orderId", orderId);
    if (itemsErr) throw itemsErr;

    const total = (orderItems || []).reduce(
        (sum, it) => sum + (it.price || 0) * (it.quantity || 0),
        0
    );

    const { data, error } = await supabase
        .from("order")
        .update({ total })
        .eq("id", orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getActiveOrderByTable = async (tableId) => {
    const { data, error } = await supabase
        .from("order")
        .select("*")
        .eq("tableId", tableId)
        .in("status", ["PENDING"]) // hoặc thêm 'ACTIVE' nếu bạn muốn
        .maybeSingle(); // tránh throw error khi không có rows
    if (error && error.code !== "PGRST116") throw error;
    return data;
};

export const getOrder = async (orderId) => {
    const { data, error } = await supabase
        .from("order")
        .select("*")
        .eq("id", orderId)
        .single();
    if (error) throw error;
    return data;
};

export const payOrder = async (orderId) => {
    const { data, error } = await supabase
        .from("order")
        .update({ status: "PAID" })
        .eq("id", orderId)
        .select()
        .single();

    if (error) throw error;

    // giải phóng bàn
    if (data?.tableId) {
        await supabase
            .from("table")
            .update({ isAvailable: true })
            .eq("id", data.tableId);
    }

    return data;
};

export const cancelOrder = async (orderId, reason) => {
    const { data, error } = await supabase
        .from("order")
        .update({
            status: "CANCELLED",
            cancelReason: reason,
            cancelledAt: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();
    if (error) throw error;

    if (data?.tableId) {
        await supabase
            .from("table")
            .update({ isAvailable: true })
            .eq("id", data.tableId);
    }
    return data;
};

// ===== Customers =====
export const fetchCustomers = async (q) => {
    let query = supabase.from("customers").select("*");
    if (q) query = query.ilike("name", `%${q}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// ===== Revenue =====
export const getRevenue = async () => {
    const { data, error } = await supabase
        .from("order")
        .select("total, status, createdAt");
    if (error) throw error;
    return data
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + (o.total || 0), 0);
};
