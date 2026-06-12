"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  doc, onSnapshot, getDoc, updateDoc, arrayRemove
} from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heart, MapPin, Star, ShieldCheck, Search, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface SavedProvider {
  id: string;
  businessName: string;
  firstName: string;
  lastName: string;
  servicesOffered: string;
  location: string;
  hourlyRate: string;
  photoURL?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  trustScore?: number;
}

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<SavedProvider[]>([]);
  const [fetching, setFetching] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), async (snap) => {
      if (!snap.exists()) { setFetching(false); return; }
      const savedIds: string[] = snap.data().savedProviders || [];

      if (savedIds.length === 0) {
        setProviders([]);
        setFetching(false);
        return;
      }

      // Fetch each saved provider's data
      const providerDocs = await Promise.all(
        savedIds.map(id => getDoc(doc(db, "providers", id)))
      );

      const results: SavedProvider[] = providerDocs
        .filter(d => d.exists() && d.data()?.status === "Approved")
        .map(d => ({ id: d.id, ...d.data() } as SavedProvider));

      setProviders(results);
      setFetching(false);
    });

    return () => unsubUser();
  }, [user?.uid]);

  const removeFromFavorites = async (providerId: string) => {
    if (!user?.uid) return;
    setRemovingId(providerId);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        savedProviders: arrayRemove(providerId)
      });
    } catch (e) {
      console.error("Error removing favorite:", e);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary-900">Saved Professionals</h1>
          </div>
          <p className="text-secondary-500">Your favorited service providers, all in one place.</p>
        </div>

        {fetching ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-secondary-100 animate-pulse" />)}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-secondary-200 rounded-2xl bg-white">
            <Heart className="w-16 h-16 text-secondary-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-secondary-500">No saved professionals yet</h3>
            <p className="text-secondary-400 mt-2">Browse and click the heart icon to save providers you love.</p>
            <Link href="/search">
              <Button className="mt-6">
                <Search className="w-4 h-4 mr-2" /> Browse Professionals
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, i) => {
              const trustScore = provider.trustScore || Math.min(95, 60 + (provider.reviewCount || 0) * 2 + (provider.isVerified ? 15 : 0));
              return (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white h-full">
                    <div className="h-40 bg-gradient-to-br from-primary-100 to-indigo-100 relative flex items-center justify-center">
                      {provider.photoURL ? (
                        <Image src={provider.photoURL} alt={provider.businessName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary-600">
                            {(provider.businessName || provider.firstName || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      {provider.isVerified && (
                        <div className="absolute top-3 left-3 bg-primary-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </div>
                      )}
                      {/* Remove from favorites */}
                      <button
                        id={`remove-fav-${provider.id}`}
                        onClick={() => removeFromFavorites(provider.id)}
                        disabled={removingId === provider.id}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                        title="Remove from favorites"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 stroke-rose-500" />
                      </button>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                        {provider.businessName || `${provider.firstName} ${provider.lastName}`}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-0.5 truncate">{provider.servicesOffered}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-secondary-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.location || "N/A"}</span>
                        {provider.rating && (
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{provider.rating.toFixed(1)}</span>
                        )}
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <Award className="w-3 h-3" />{trustScore}/100
                        </span>
                      </div>
                      {provider.hourlyRate && (
                        <p className="font-bold text-primary-700 mt-2">${provider.hourlyRate}/hr</p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Link href={`/provider/${provider.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">View Profile</Button>
                        </Link>
                        <Link href={`/booking/new?provider=${provider.id}`} className="flex-1">
                          <Button className="w-full" size="sm">Book Now</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
