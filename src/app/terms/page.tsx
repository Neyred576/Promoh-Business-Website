import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">Terms of Service</h1>
        <p className="text-secondary-500 mb-10">Last updated: June 2026</p>
        <div className="prose prose-slate max-w-none space-y-8 text-secondary-700">
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Promoh, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">2. Platform Role</h2>
            <p>Promoh is a marketplace that connects customers with independent service providers. Promoh does not employ service providers and is not responsible for the quality, safety, or legality of services offered.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">3. User Accounts</h2>
            <p>You are responsible for maintaining the security of your account and all activities that occur under it. You must provide accurate and complete information when creating an account.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">4. Provider Verification</h2>
            <p>Service providers must complete our verification process before offering services. Promoh reserves the right to approve, reject, or suspend any provider account at its discretion.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">5. Payments & Fees</h2>
            <p>Promoh charges a platform commission on completed bookings. Payments are processed securely via Stripe and PayPal. Refund policies are subject to individual provider agreements.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">6. Contact</h2>
            <p>For any questions regarding these terms, please contact us at <a href="mailto:promoh321@gmail.com" className="text-primary-600 hover:underline">promoh321@gmail.com</a>.</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-secondary-200">
          <Link href="/" className="text-primary-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
