"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X, Flag, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REPORT_REASONS_PROVIDER = [
  "Unprofessional behavior",
  "Did not show up",
  "Fraudulent service",
  "Poor quality work",
  "Aggressive or threatening",
  "Fake profile or credentials",
  "Requested payment outside platform",
  "Other",
];

const REPORT_REASONS_CUSTOMER = [
  "No-show without notice",
  "Abusive or threatening behavior",
  "Payment fraud",
  "Fake booking",
  "Harassment",
  "Other",
];

interface ReportModalProps {
  targetId: string;
  targetName: string;
  targetType: "provider" | "customer";
  onClose: () => void;
}

export default function ReportModal({ targetId, targetName, targetType, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = targetType === "provider" ? REPORT_REASONS_PROVIDER : REPORT_REASONS_CUSTOMER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !user?.uid) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        reporterId: user.uid,
        reporterName: user.displayName || user.email,
        targetId,
        targetName,
        targetType,
        reason,
        description,
        status: "open",
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit report:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Report Submitted</h3>
              <p className="text-secondary-500 text-sm mb-6">
                Thank you for helping keep Promoh safe. Our moderation team will review your report within 24 hours.
              </p>
              <Button onClick={onClose} className="w-full">Done</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">Report {targetType === "provider" ? "Provider" : "Customer"}</h3>
                    <p className="text-xs text-secondary-500">{targetName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary-100 rounded-xl text-secondary-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-2 text-secondary-700">Reason for report *</label>
                  <div className="relative">
                    <select
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required
                      className="w-full appearance-none rounded-xl border border-secondary-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 pr-10"
                    >
                      <option value="">Select a reason...</option>
                      {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2 text-secondary-700">Additional details (optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Please provide any additional context to help our team investigate..."
                    rows={4}
                    className="w-full rounded-xl border border-secondary-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 placeholder:text-secondary-400 resize-none"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  ⚠️ False reports may result in action against your account. Only report genuine issues.
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    isLoading={submitting}
                    disabled={!reason}
                  >
                    <Flag className="w-4 h-4 mr-1.5" /> Submit Report
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
