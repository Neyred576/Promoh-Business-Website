"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ShieldCheck, MapPin, Star, Phone, Mail, MessageSquare,
  CalendarCheck, ArrowLeft, Clock, Award
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface ProviderData {
  businessName: string;
  firstName: string;
  lastName: string;
  description: string;
  servicesOffered: string;
  location: string;
  hourlyRate: string;
  phone: string;
  email: string;
  photoURL?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  status: string;
  trustScore?: number;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;

    // Real-time Provider profile
    const unsubProvider = onSnapshot(doc(db, "providers", providerId), (docSnap) => {
      if (docSnap.exists()) {
        setProvider(docSnap.data() as ProviderData);
      } else {
        setProvider(null);
      }
      setLoading(false);
    });

    // Real-time Reviews
    const unsubReviews = onSnapshot(query(collection(db, "reviews"), where("providerId", "==", providerId)), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    });

    return () => {
      unsubProvider();
      unsubReviews();
    };
  }, [providerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <div className="h-48 bg-secondary-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-secondary-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-secondary-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!provider || provider.status !== "Approved") {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-secondary-700">Provider not found</h1>
          <p className="text-secondary-500 mt-2">This profile may not exist or is pending verification.</p>
          <Link href="/search"><Button className="mt-6">Browse Professionals</Button></Link>
        </div>
      </div>
    );
  }

  const displayName = provider.businessName || `${provider.firstName} ${provider.lastName}`;
  const services = provider.servicesOffered?.split(",").map(s => s.trim()).filter(Boolean) || [];
  const trustScore = provider.trustScore || Math.min(95, 70 + (provider.reviewCount || 0) * 2);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-secondary-500 hover:text-secondary-900 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary-400 to-indigo-500 relative">
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <CardContent className="p-6 relative">
                  {/* Avatar */}
                  <div className="absolute -top-12 left-6 w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                    {provider.photoURL ? (
                      <Image src={provider.photoURL} alt={displayName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{displayName[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-32">
                    <div className="flex items-start gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-secondary-900">{displayName}</h1>
                      {provider.isVerified && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold border border-primary-200">
                          <ShieldCheck className="w-4 h-4" /> Verified Provider
                        </span>
                      )}
                    </div>
                    <p className="text-secondary-600 mt-1">{services[0] || "Professional Services"}</p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {provider.location && (
                        <span className="flex items-center gap-1 text-sm text-secondary-500">
                          <MapPin className="w-4 h-4" />{provider.location}
                        </span>
                      )}
                      {provider.rating && (
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {provider.rating.toFixed(1)} ({provider.reviewCount || 0} reviews)
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                        <Award className="w-4 h-4" /> Trust Score: {trustScore}/100
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* About */}
            {provider.description && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-3">About</h2>
                    <p className="text-secondary-600 leading-relaxed">{provider.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4">Services Offered</h2>
                    <div className="flex flex-wrap gap-2">
                      {services.map((svc) => (
                        <span key={svc} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-100">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-4">
                    Reviews {reviews.length > 0 && <span className="text-secondary-500 font-normal">({reviews.length})</span>}
                  </h2>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-secondary-200 rounded-xl">
                      <Star className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                      <p className="text-secondary-500">No reviews yet. Be the first to book!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="p-4 bg-white rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-secondary-900">{review.customerName}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                          </div>
                          <p className="text-secondary-600 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="sticky top-28">
                <CardContent className="p-6 space-y-4">
                  {provider.hourlyRate && (
                    <div className="text-center py-3 bg-white rounded-xl">
                      <p className="text-secondary-500 text-sm">Starting from</p>
                      <p className="text-3xl font-bold text-primary-700">${provider.hourlyRate}<span className="text-base font-medium text-secondary-500">/hr</span></p>
                    </div>
                  )}

                  <Link href={`/booking/new?provider=${providerId}`} className="block">
                    <Button id="book-service-btn" className="w-full" size="lg">
                      <CalendarCheck className="w-5 h-5 mr-2" /> Book Service
                    </Button>
                  </Link>

                  <Link href={`/chat?provider=${providerId}`} className="block">
                    <Button id="chat-provider-btn" variant="outline" className="w-full">
                      <MessageSquare className="w-5 h-5 mr-2" /> Chat
                    </Button>
                  </Link>

                  {provider.phone && (
                    <a href={`tel:${provider.phone}`} className="block">
                      <Button id="contact-provider-btn" variant="secondary" className="w-full">
                        <Phone className="w-5 h-5 mr-2" /> Call {provider.phone}
                      </Button>
                    </a>
                  )}

                  {provider.email && (
                    <a href={`mailto:${provider.email}`} className="block">
                      <Button variant="ghost" className="w-full text-sm text-secondary-600">
                        <Mail className="w-4 h-4 mr-2" /> {provider.email}
                      </Button>
                    </a>
                  )}

                  <div className="pt-2 border-t border-secondary-200 space-y-2 text-sm text-secondary-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary-400" />
                      <span>Typically responds within 1 hour</span>
                    </div>
                    {provider.isVerified && (
                      <div className="flex items-center gap-2 text-primary-700">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Identity Verified by Promoh</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
