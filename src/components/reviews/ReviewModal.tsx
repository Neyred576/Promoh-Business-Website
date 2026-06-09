"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, updateDoc, doc, getDoc, runTransaction } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Star, X } from "lucide-react";

interface ReviewModalProps {
  bookingId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ bookingId, providerId, customerId, customerName, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setLoading(true);

    try {
      // 1. Add review doc
      await addDoc(collection(db, "reviews"), {
        bookingId,
        providerId,
        customerId,
        customerName,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      });

      // 2. Mark booking as reviewed
      await updateDoc(doc(db, "bookings", bookingId), { reviewed: true });

      // 3. Recalculate provider average rating (Transaction to ensure consistency)
      const providerRef = doc(db, "providers", providerId);
      await runTransaction(db, async (transaction) => {
        const providerDoc = await transaction.get(providerRef);
        if (!providerDoc.exists()) return;

        const data = providerDoc.data();
        const currentRating = data.rating || 0;
        const currentCount = data.reviewCount || 0;

        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;

        transaction.update(providerRef, {
          rating: newRating,
          reviewCount: newCount
        });
      });

      onSuccess();
    } catch (err: any) {
      setError("Failed to submit review. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in zoom-in-95">
        <CardHeader className="relative">
          <Button variant="ghost" size="sm" className="absolute right-4 top-4" onClick={onClose}>
            <X className="w-5 h-5 text-secondary-500" />
          </Button>
          <CardTitle>Rate your experience</CardTitle>
          <CardDescription>How was the service provided?</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-xl">{error}</div>}
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 ${
                    (hoverRating || rating) >= star 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-secondary-200"
                  }`} />
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2 text-secondary-700">Add a comment (Optional)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What did you like or dislike?"
                className="flex min-h-[120px] w-full rounded-xl border border-secondary-300 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Submit Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
