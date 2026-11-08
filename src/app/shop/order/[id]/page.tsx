import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabaseServer } from "@/utils/supabaseServer";
import { formatPrice } from "@/lib/shopShared";
import { ORDER_STATUS_LABEL, mapOrderRow } from "@/lib/shopOrdersShared";
import styles from "../../cart.module.css";
import shop from "../../shop.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Your order | Diving Sanatan" },
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { data } = await supabaseServer.from("shop_orders").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = mapOrderRow(data);

  const tone =
    o.status === "cancelled" || o.status === "refunded" ? styles.statusBad
    : o.status === "pending_payment" ? styles.statusWarn
    : styles.statusGood;

  const message =
    o.status === "pending_payment" && o.paymentMethod === "manual"
      ? "Thank you! We have received your order and will contact you shortly with payment details."
      : o.status === "pending_payment"
        ? "We have not received your payment yet. If money was deducted, please contact us with your order number."
        : o.status === "cancelled" || o.status === "refunded"
          ? "This order has been cancelled. Please contact us if you have any questions."
          : o.status === "shipped"
            ? "Your order is on its way."
            : o.status === "delivered"
              ? "Your order has been delivered. We hope you love it."
              : "Thank you! Your payment is confirmed and we are preparing your order.";

  return (
    <div className="page-shell">
      <Header />
      <main className={styles.wrap}>
        <h1 className={styles.h1}>Order {o.orderNumber}</h1>
        <span className={`${styles.statusPill} ${tone}`}>{ORDER_STATUS_LABEL[o.status]}</span>
        <p className={styles.orderMeta}>
          {message}
          {o.trackingInfo && (<><br /><strong>Tracking:</strong> {o.trackingInfo}</>)}
        </p>

        <div className={`${styles.card}`} style={{ maxWidth: 640 }}>
          <h2 className={styles.sumTitle}>Items</h2>
          {o.items.map((l, i) => (
            <div key={i} className={styles.sumRow}><span>{l.name} × {l.qty}</span><span>{formatPrice(l.lineTotal, o.currency)}</span></div>
          ))}
          <div className={styles.sumRow}><span>Shipping</span><span>{o.shippingFee > 0 ? formatPrice(o.shippingFee, o.currency) : "Free"}</span></div>
          <div className={styles.sumTotal}><span>Total</span><span>{formatPrice(o.total, o.currency)}</span></div>
          <p className={styles.orderMeta} style={{ marginBottom: 0 }}>
            Delivering to {o.customerName}, {o.shippingCity}. Keep this page&apos;s link to check on your order later.
          </p>
        </div>

        <p style={{ marginTop: 28 }}><Link href="/shop" className={shop.buy}>Continue shopping</Link></p>
      </main>
      <Footer />
    </div>
  );
}
