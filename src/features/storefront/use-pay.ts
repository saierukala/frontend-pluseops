"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RazorpayCheckout, StartedPayment } from "@/lib/storefront/api";
import { toastError } from "@/lib/api-errors";
import { useShop } from "./shop-context";

interface RazorpayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void };

let scriptPromise: Promise<RazorpayCtor> | null = null;

function loadRazorpay(): Promise<RazorpayCtor> {
  const existing = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve((window as unknown as { Razorpay: RazorpayCtor }).Razorpay);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

class PaymentCancelled extends Error {}

/** Opens Razorpay's hosted checkout; resolves with the signed result, rejects if the shopper closes it or it fails. */
async function openRazorpay(checkout: RazorpayCheckout): Promise<RazorpayResult> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: checkout.keyId,
      order_id: checkout.orderId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      prefill: checkout.prefill,
      handler: (res: RazorpayResult) => resolve(res),
      modal: { ondismiss: () => reject(new PaymentCancelled("Payment cancelled")) },
    });
    rzp.on("payment.failed", (res) => reject(new Error(res.error?.description ?? "Payment failed")));
    rzp.open();
  });
}

/**
 * Settles a started payment. With Razorpay connected the shopper pays in Razorpay's window and the result is
 * verified server-side; otherwise the payment stays pending until the shop confirms it (cash, bank transfer…).
 */
export function useCompletePayment() {
  const { client, slug } = useShop();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: StartedPayment) => {
      if (!payment.checkout) return payment;
      const res = await openRazorpay(payment.checkout);
      return client.verifyPayment(payment.id, { razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature });
    },
    onSuccess: (payment) => {
      if (payment.status === "COMPLETED") toast.success("Payment received — thank you!");
      else toast.info("Order placed", { description: "The store will confirm your payment shortly." });
    },
    onError: (e) => {
      if (e instanceof PaymentCancelled) toast("Payment not completed", { description: "You can pay any time from your order." });
      else toastError(e, "Payment failed");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["shop", slug, "orders"] }),
  });
}
