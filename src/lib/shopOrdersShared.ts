/** Order types and helpers shared by server and browser code. */
export const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export interface OrderLine {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  image: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "razorpay" | "manual";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingCountry: string;
  items: OrderLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  razorpayPaymentId: string;
  customerNotes: string;
  trackingInfo: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrderRow(r: any): ShopOrder {
  return {
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    paymentMethod: r.payment_method,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    shippingAddress: r.shipping_address,
    shippingCity: r.shipping_city,
    shippingState: r.shipping_state,
    shippingPincode: r.shipping_pincode,
    shippingCountry: r.shipping_country,
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: Number(r.subtotal ?? 0),
    shippingFee: Number(r.shipping_fee ?? 0),
    total: Number(r.total ?? 0),
    currency: r.currency || "INR",
    razorpayPaymentId: r.razorpay_payment_id || "",
    customerNotes: r.customer_notes || "",
    trackingInfo: r.tracking_info || "",
    adminNotes: r.admin_notes || "",
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}
