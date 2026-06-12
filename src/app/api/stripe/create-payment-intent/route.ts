import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, bookingId, customerId, providerId } = await req.json();

    if (!amount || !bookingId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if Stripe key is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey === "your_stripe_secret_key") {
      return NextResponse.json({
        error: "Stripe not configured. Please add STRIPE_SECRET_KEY to .env.local",
        demo: true,
        clientSecret: "demo_secret_" + bookingId,
      }, { status: 200 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" as any });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: (currency || "usd").toLowerCase(),
      metadata: {
        bookingId,
        customerId: customerId || "",
        providerId: providerId || "",
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Stripe payment intent error:", error);
    return NextResponse.json({ error: error.message || "Payment error" }, { status: 500 });
  }
}
