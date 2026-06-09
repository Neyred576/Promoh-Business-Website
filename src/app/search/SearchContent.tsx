"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Search, MapPin, Star, ShieldCheck, SlidersHorizontal, X,
  Zap, Wrench, SprayCan, GraduationCap, Camera, Car, Hammer,
  Paintbrush, Package, Scissors, Monitor, Home as HomeIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { useEffect } from "react";

interface Provider {
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
  status: string;
  description?: string;
}

const CATEGORIES = [
  { name: "All", slug: "", icon: null },
  { name: "Electricians", slug: "Electricians", icon: <Zap className="w-4 h-4" /> },
  { name: "Plumbers", slug: "Plumbers", icon: <Wrench className="w-4 h-4" /> },
  { name: "Cleaners", slug: "Cleaners", icon: <SprayCan className="w-4 h-4" /> },
  { name: "Tutors", slug: "Tutors", icon: <GraduationCap className="w-4 h-4" /> },
  { name: "Photographers", slug: "Photographers", icon: <Camera className="w-4 h-4" /> },
  { name: "Mechanics", slug: "Mechanics", icon: <Car className="w-4 h-4" /> },
  { name: "Carpenters", slug: "Carpenters", icon: <Hammer className="w-4 h-4" /> },
  { name: "Painters", slug: "Painters", icon: <Paintbrush className="w-4 h-4" /> },
  { name: "Movers", slug: "Movers", icon: <Package className="w-4 h-4" /> },
  { name: "Beauty", slug: "Beauty", icon: <Scissors className="w-4 h-4" /> },
  { name: "IT Specialists", slug: "IT", icon: <Monitor className="w-4 h-4" /> },
  { name: "Home Repair", slug: "HomeRepair", icon: <HomeIcon className="w-4 h-4" /> },
];

export default function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("q") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(
        query(collection(db, "providers"), where("status", "==", "Approved"))
      );
      let results: Provider[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Provider, "id">
      }));

      const search = searchQuery.toLowerCase().trim();
      const location = locationQuery.toLowerCase().trim();

      if (search) {
        results = results.filter(p =>
          p.businessName?.toLowerCase().includes(search) ||
          p.servicesOffered?.toLowerCase().includes(search) ||
          p.firstName?.toLowerCase().includes(search) ||
          p.lastName?.toLowerCase().includes(search)
        );
      }
      if (location) {
        results = results.filter(p => p.location?.toLowerCase().includes(location));
      }
      if (verifiedOnly) results = results.filter(p => p.isVerified);
      if (minRating > 0) results = results.filter(p => (p.rating || 0) >= minRating);
      if (maxPrice) results = results.filter(p => Number(p.hourlyRate) <= Number(maxPrice));

      setProviders(results);
    } catch (err) {
      console.error(err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, locationQuery, verifiedOnly, minRating, maxPrice]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (locationQuery) params.set("location", locationQuery);
    router.push(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setSearchQuery(slug);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Search Header Bar */}
      <div className="bg-white border-b sticky top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative flex items-center bg-white rounded-xl border border-secondary-200 hover:border-primary-400 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <Search className="absolute left-4 w-5 h-5 text-secondary-400 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search by service, provider name..."
                className="border-0 shadow-none focus-visible:ring-0 pl-12 bg-transparent h-12"
              />
            </div>
            <div className="flex-1 relative flex items-center bg-white rounded-xl border border-secondary-200 hover:border-primary-400 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <MapPin className="absolute left-4 w-5 h-5 text-secondary-400 pointer-events-none" />
              <Input
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="City, country..."
                className="border-0 shadow-none focus-visible:ring-0 pl-12 bg-transparent h-12"
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-8">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            <Button variant="outline" className="h-12 gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
              {(verifiedOnly || minRating > 0 || maxPrice) && <span className="w-2 h-2 rounded-full bg-primary-600" />}
            </Button>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-secondary-200 flex flex-wrap gap-6 items-end">
              <div>
                <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider block mb-2">Min Rating</label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map(r => (
                    <button key={r} onClick={() => setMinRating(r)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${minRating === r ? "bg-primary-600 text-white border-primary-600" : "border-secondary-300 hover:border-primary-400"}`}>
                      {r === 0 ? "Any" : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider block mb-2">Max Price ($/hr)</label>
                <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  placeholder="e.g. 100" className="w-32 h-9 text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${verifiedOnly ? "bg-primary-600" : "bg-secondary-300"}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${verifiedOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <label className="text-sm font-medium flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-primary-600" /> Verified Only
                </label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setVerifiedOnly(false); setMinRating(0); setMaxPrice(""); }}>
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-secondary-200 p-4 sticky top-48">
              <h3 className="font-bold text-secondary-900 mb-4 text-sm uppercase tracking-wider">Categories</h3>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button key={cat.slug} onClick={() => handleCategoryClick(cat.slug)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${selectedCategory === cat.slug ? "bg-primary-50 text-primary-700 border border-primary-200" : "hover:bg-white text-secondary-700"}`}>
                    {cat.icon && <span className="text-secondary-400">{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <p className="text-secondary-500 font-medium mb-6">
              {loading ? "Searching..." : `${providers.length} professional${providers.length !== 1 ? "s" : ""} found`}
            </p>

            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl bg-secondary-100 animate-pulse h-72" />)}
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-secondary-200 rounded-2xl bg-white">
                <Search className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-secondary-500">No professionals found</h3>
                <p className="text-secondary-400 mt-2">Try adjusting your search or filters.</p>
                <Button className="mt-6" onClick={() => { setSearchQuery(""); setLocationQuery(""); }}>
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {providers.map((provider, i) => (
                  <motion.div key={provider.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/provider/${provider.id}`}>
                      <Card className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 h-full">
                        <div className="h-36 bg-gradient-to-br from-primary-100 to-indigo-100 relative flex items-center justify-center">
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
                          {provider.rating && (
                            <div className="absolute top-3 right-3 bg-white/90 px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-semibold shadow">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {provider.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                            {provider.businessName || `${provider.firstName} ${provider.lastName}`}
                          </h3>
                          <p className="text-sm text-secondary-500 mt-0.5 truncate">{provider.servicesOffered}</p>
                          <div className="flex items-center justify-between mt-3 text-sm">
                            <span className="flex items-center gap-1 text-secondary-500 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />{provider.location || "N/A"}
                            </span>
                            {provider.hourlyRate && (
                              <span className="font-bold text-primary-700 shrink-0">${provider.hourlyRate}/hr</span>
                            )}
                          </div>
                          <Button className="w-full mt-4" size="sm" variant="outline">View Profile</Button>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
