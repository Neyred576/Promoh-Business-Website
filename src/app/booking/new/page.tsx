import { Suspense } from "react";
import BookingContent from "./BookingContent";

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
