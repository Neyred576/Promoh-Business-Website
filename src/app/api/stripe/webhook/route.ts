import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || stripeSecretKey === "your_stripe_secret_key") {
    return NextResponse.json({ received: true, demo: true });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" as any });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret || "");
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    // Import Firebase Admin
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const adminDb = getFirestore();

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const { bookingId, providerId } = pi.metadata;

      // Update booking status
      if (bookingId) {
        await adminDb.collection("bookings").doc(bookingId).update({
          paymentStatus: "paid",
          paymentIntentId: pi.id,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Notify provider about payment
        if (providerId) {
          await adminDb.collection("notifications").add({
            userId: providerId,
            title: "💰 Payment Received",
            message: `Payment of $${(pi.amount / 100).toFixed(2)} received for booking.`,
            link: "/provider/dashboard",
            type: "booking_completed",
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      const { bookingId, customerId } = pi.metadata;

      if (bookingId) {
        await adminDb.collection("bookings").doc(bookingId).update({
          paymentStatus: "failed",
          updatedAt: new Date().toISOString(),
        });

        if (customerId) {
          await adminDb.collection("notifications").add({
            userId: customerId,
            title: "❌ Payment Failed",
            message: "Your payment could not be processed. Please try again.",
            link: `/payment/${bookingId}`,
            type: "booking_update",
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
