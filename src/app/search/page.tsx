import { Suspense } from "react";
import SearchContent from "./SearchContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Professionals | Promoh",
  description: "Search and browse verified service professionals near you.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
