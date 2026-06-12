"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Search, MapPin, ShieldCheck, MessageSquare, CheckCircle, ArrowRight,
  Star, Zap, Wrench, SprayCan, GraduationCap, Camera, Car, Hammer,
  Paintbrush, Package, Scissors, Monitor, Home as HomeIcon, AlertTriangle, Mail
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, limit, doc, onSnapshot } from "firebase/firestore";

interface FeaturedProvider {
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
}

const defaultCategoryMap: Record<string, { icon: React.ReactNode, color: string, bg: string }> = {
  "Electricians": { icon: <Zap className="w-8 h-8" />, color: "text-yellow-500", bg: "bg-yellow-50" },
  "Plumbers": { icon: <Wrench className="w-8 h-8" />, color: "text-blue-500", bg: "bg-blue-50" },
  "Cleaners": { icon: <SprayCan className="w-8 h-8" />, color: "text-green-500", bg: "bg-green-50" },
  "Tutors": { icon: <GraduationCap className="w-8 h-8" />, color: "text-purple-500", bg: "bg-purple-50" },
  "Photographers": { icon: <Camera className="w-8 h-8" />, color: "text-pink-500", bg: "bg-pink-50" },
  "Mechanics": { icon: <Car className="w-8 h-8" />, color: "text-red-500", bg: "bg-red-50" },
  "Carpenters": { icon: <Hammer className="w-8 h-8" />, color: "text-amber-700", bg: "bg-amber-50" },
  "Painters": { icon: <Paintbrush className="w-8 h-8" />, color: "text-teal-500", bg: "bg-teal-50" },
  "Movers": { icon: <Package className="w-8 h-8" />, color: "text-orange-500", bg: "bg-orange-50" },
  "Beauty Pros": { icon: <Scissors className="w-8 h-8" />, color: "text-rose-500", bg: "bg-rose-50" },
  "IT Specialists": { icon: <Monitor className="w-8 h-8" />, color: "text-indigo-500", bg: "bg-indigo-50" },
  "Home Repair": { icon: <HomeIcon className="w-8 h-8" />, color: "text-secondary-600", bg: "bg-secondary-100" },
};

const getCategoryStyles = (name: string) => {
  return defaultCategoryMap[name] || { icon: <Search className="w-8 h-8" />, color: "text-primary-500", bg: "bg-primary-50" };
};


const emergencyServices = [
  { name: "Emergency Electrician", icon: <Zap className="w-5 h-5" />, slug: "Electricians" },
  { name: "Emergency Plumber", icon: <Wrench className="w-5 h-5" />, slug: "Plumbers" },
  { name: "Locksmith", icon: <ShieldCheck className="w-5 h-5" />, slug: "Locksmith" },
];

const steps = [
  { title: "Search & Compare", desc: "Find verified professionals near you and compare their profiles, prices, and reviews.", icon: <Search className="w-8 h-8 text-primary-600" /> },
  { title: "Chat & Book", desc: "Discuss your project details in real-time and book a time that works for you.", icon: <MessageSquare className="w-8 h-8 text-primary-600" /> },
  { title: "Get it Done", desc: "Your selected professional arrives and completes the job to your satisfaction.", icon: <CheckCircle className="w-8 h-8 text-primary-600" /> }
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [featuredProviders, setFeaturedProviders] = useState<FeaturedProvider[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [popularCategories, setPopularCategories] = useState<string[]>([]);
  const [activeEmergencyServices, setActiveEmergencyServices] = useState<{name: string, slug: string}[]>([]);
  const [activeExploreCategories, setActiveExploreCategories] = useState<{name: string, slug: string}[]>([]);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (locationQuery.trim()) params.set("location", locationQuery.trim());
    router.push(`/search?${params.toString()}`);
  }, [searchQuery, locationQuery, router]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Fetch real-time featured providers from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "providers"),
      where("status", "==", "Approved"),
      where("isFeatured", "==", true),
      limit(6)
    );
    
    const unsubFeatured = onSnapshot(q, (snapshot) => {
      const providers: FeaturedProvider[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<FeaturedProvider, "id">
      }));
      setFeaturedProviders(providers);
      setLoadingFeatured(false);
    }, (error) => {
      setFeaturedProviders([]);
      setLoadingFeatured(false);
    });
    
    // Listen for real-time platform settings changes
    const unsubSettings = onSnapshot(doc(db, "platform_settings", "homepage"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.popularCategories) setPopularCategories(data.popularCategories);
        if (data.emergencyServices) setActiveEmergencyServices(data.emergencyServices);
        
        // Use default categories if exploreCategories isn't set yet (for backward compatibility)
        if (data.exploreCategories) {
          setActiveExploreCategories(data.exploreCategories);
        } else {
          setActiveExploreCategories(Object.keys(defaultCategoryMap).map(name => ({ name, slug: name })));
        }
      }
    });
    
    return () => {
      unsubSettings();
      unsubFeatured();
    };
  }, []);

  return (
    <main className="flex-1">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary-700 text-sm font-semibold mb-6 border border-primary-100 shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span>100% Verified Professionals Worldwide</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-secondary-900 max-w-4xl leading-tight"
          >
            Find Trusted Professionals{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Anywhere.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-xl text-secondary-600 max-w-2xl"
          >
            Find. Compare. Chat. Book. Done. The world's most trusted marketplace for hiring local service experts.
          </motion.p>

          {/* Real-time Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 w-full max-w-3xl bg-white p-2 md:p-3 rounded-full shadow-2xl shadow-primary-900/10 flex flex-col md:flex-row gap-2 border border-secondary-100"
          >
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-secondary-400 pointer-events-none" />
              <Input
                id="search-service"
                placeholder="What service do you need?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="border-0 shadow-none focus-visible:ring-0 pl-12 h-14 text-base rounded-full"
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-secondary-200 my-auto" />
            <div className="flex-1 relative flex items-center">
              <MapPin className="absolute left-4 w-5 h-5 text-secondary-400 pointer-events-none" />
              <Input
                id="search-location"
                placeholder="Location (city, country)"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="border-0 shadow-none focus-visible:ring-0 pl-12 h-14 text-base rounded-full"
              />
            </div>
            <Button id="search-btn" size="lg" className="h-14 px-8 md:w-auto w-full rounded-full" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </motion.div>

          {/* Quick category pills */}
          {popularCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 flex flex-wrap justify-center gap-3 text-sm"
            >
              <span className="text-secondary-500 font-medium my-auto mr-1">Popular:</span>
              {popularCategories.map((cat) => (
                <Link key={cat} href={`/search?q=${cat}`}
                  className="px-4 py-2 rounded-full border border-secondary-200 bg-white hover:border-primary-500 hover:text-primary-600 hover:shadow-sm transition-all">
                  {cat}
                </Link>
              ))}
            </motion.div>
          )}

          {/* Emergency Services Banner */}
          {activeEmergencyServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-6 flex flex-wrap justify-center gap-3"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Emergency Services Available 24/7:
              </div>
              {activeEmergencyServices.map((svc) => (
                <Link key={svc.name} href={`/search?q=${svc.slug}&emergency=true`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                  <Zap className="w-4 h-4" /> {svc.name}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Service Categories - Functional with Lucide icons */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Explore Categories</h2>
              <p className="text-secondary-600 mt-2">Click any category to browse verified professionals.</p>
            </div>
            <Link href="/search">
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeExploreCategories.map((cat, i) => {
              const styles = getCategoryStyles(cat.name);
              return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              >
                <Link href={`/search?q=${cat.slug}`}>
                  <Card className="hover:border-primary-400 hover:shadow-lg cursor-pointer transition-all group overflow-hidden h-full">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl ${styles.bg} ${styles.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        {styles.icon}
                      </div>
                      <span className="font-semibold text-sm text-secondary-800">{cat.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )})}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-secondary-50 to-blue-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">How Promoh Works</h2>
            <p className="text-secondary-600 mt-2 text-lg">Your easiest path to hiring trusted professionals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-14 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                className="relative text-center flex flex-col items-center"
              >
                <div className="w-28 h-28 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-xl border border-secondary-100 relative z-10 mb-6">
                  {step.icon}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-secondary-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers - Real-time from Firestore */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured Professionals</h2>
              <p className="text-secondary-600 mt-2">Hand-picked verified experts ready to help you today.</p>
            </div>
            <Link href="/search">
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-secondary-200 h-80 bg-secondary-100 animate-pulse" />
              ))}
            </div>
          ) : featuredProviders.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-secondary-200 rounded-2xl bg-white">
              <ShieldCheck className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-500">No featured providers yet</h3>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredProviders.map((provider, i) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/provider/${provider.id}`}>
                    <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                      <div className="h-44 bg-gradient-to-br from-primary-100 to-indigo-100 relative flex items-center justify-center">
                        {provider.photoURL ? (
                          <Image src={provider.photoURL} alt={provider.businessName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center">
                            <span className="text-4xl font-bold text-primary-600">
                              {(provider.businessName || provider.firstName || "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        {provider.rating && (
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-sm font-semibold shadow">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {provider.rating.toFixed(1)}
                          </div>
                        )}
                        {provider.isVerified && (
                          <div className="absolute top-4 left-4 bg-primary-600/90 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-semibold">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-lg text-secondary-900 group-hover:text-primary-600 transition-colors">
                          {provider.businessName || `${provider.firstName} ${provider.lastName}`}
                        </h3>
                        <p className="text-sm text-secondary-500 mt-0.5">{provider.servicesOffered}</p>
                        <div className="flex items-center justify-between text-sm text-secondary-500 mt-3">
                          <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{provider.location || "Location N/A"}</div>
                          {provider.hourlyRate && <div className="font-bold text-primary-700">${provider.hourlyRate}/hr</div>}
                        </div>
                        <Button className="w-full mt-4" variant="outline">View Profile</Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 text-secondary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Promoh Logo" width={40} height={40} className="w-auto h-8 object-contain" />
              <span className="text-2xl font-bold text-secondary-900 tracking-tight">Promoh</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-secondary-500">Find. Compare. Chat. Book. Done. The world's trusted marketplace for service professionals.</p>
            <a href="mailto:support@promoh.com" id="contact-support-btn"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-sm text-sm w-full justify-center">
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
          <div>
            <h4 className="text-secondary-900 font-semibold mb-4">Customers</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/search" className="hover:text-primary-600 transition-colors">Find a Professional</Link></li>
              <li><Link href="/login" className="hover:text-primary-600 transition-colors">Log In</Link></li>
              <li><Link href="/register" className="hover:text-primary-600 transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-secondary-900 font-semibold mb-4">Providers</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/provider/register" className="hover:text-primary-600 transition-colors">Join as a Provider</Link></li>
              <li><Link href="/provider/login" className="hover:text-primary-600 transition-colors">Provider Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-secondary-900 font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-secondary-200 text-center text-sm text-secondary-400">
          <p>© {new Date().getFullYear()} Promoh. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
