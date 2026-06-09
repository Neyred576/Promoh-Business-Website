import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">Privacy Policy</h1>
        <p className="text-secondary-500 mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-secondary-700">
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide when registering, such as your name, email address, phone number, and profile details. We also collect usage data to improve the platform.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">2. How We Use Your Information</h2>
            <p>Your information is used to facilitate bookings, verify service providers, process payments, send notifications, and improve our services. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, Firebase security rules, and secure session management to protect your data.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">4. Cookies</h2>
            <p>We use cookies to maintain your session and improve your experience. You can disable cookies in your browser settings, though some features may not function properly.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. Contact us to exercise these rights.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">6. Contact</h2>
            <p>For privacy concerns, contact us at <a href="mailto:promoh321@gmail.com" className="text-primary-600 hover:underline">promoh321@gmail.com</a>.</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-secondary-200">
          <Link href="/" className="text-primary-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
