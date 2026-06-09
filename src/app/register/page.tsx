"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { User, Briefcase, ArrowRight } from "lucide-react";

export default function RegisterSelectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Image src="/logo.png" alt="Promoh" width={60} height={60} className="w-auto h-14" />
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-secondary-900 tracking-tight">Join Promoh</h1>
          <p className="text-secondary-600 mt-3 text-lg">Choose how you want to use the platform.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Link href="/register/customer">
              <Card className="cursor-pointer group hover:border-primary-500 hover:shadow-2xl transition-all duration-300 border-2">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">I'm a Customer</h2>
                  <p className="text-secondary-500 text-sm leading-relaxed mb-6">
                    Find and book verified professionals for any service you need.
                  </p>
                  <Button className="w-full group-hover:bg-primary-700">
                    Sign up as Customer <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Link href="/register/provider">
              <Card className="cursor-pointer group hover:border-indigo-500 hover:shadow-2xl transition-all duration-300 border-2">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">I'm a Provider</h2>
                  <p className="text-secondary-500 text-sm leading-relaxed mb-6">
                    Grow your business by connecting with customers who need your skills.
                  </p>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Apply as Provider <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        <p className="text-center mt-8 text-secondary-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
