"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ProviderProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    servicesOffered: "",
    location: "",
    phone: "",
    hourlyRate: "",
    photoURL: "",
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "providers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            businessName: data.businessName || "",
            description: data.description || "",
            servicesOffered: data.servicesOffered || "",
            location: data.location || "",
            phone: data.phone || "",
            hourlyRate: data.hourlyRate || "",
            photoURL: data.photoURL || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setSaving(true);
    setMessage("");
    
    try {
      await updateDoc(doc(db, "providers", user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setMessage("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile", error);
      setMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=3a8672d6f05b114ce3c0c6e81c8bd9fe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, photoURL: data.data.url }));
        // Also auto-save it to firestore
        if (user?.uid) {
          await updateDoc(doc(db, "providers", user.uid), { photoURL: data.data.url });
        }
        setMessage("Photo uploaded successfully!");
      } else {
        setMessage("Failed to upload photo to ImgBB.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error uploading photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading profile data...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-secondary-600 mt-1">Update your professional details to attract more customers.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your public business identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Photo</label>
              <div className="flex items-center gap-4">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-secondary-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-secondary-200 border-2 border-dashed border-secondary-300 flex items-center justify-center text-secondary-500 text-xs text-center p-2">
                    Upload Photo
                  </div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} isLoading={uploadingImage}>
                  {formData.photoURL ? "Change Photo" : "Upload Photo"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business / Provider Name</label>
              <Input 
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="John's Plumbing Services"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">About / Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="flex min-h-[100px] w-full rounded-xl border border-secondary-300 bg-transparent px-4 py-2 text-base shadow-sm placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
                placeholder="Tell customers about your experience and why they should hire you..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>What do you offer and where?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Services Offered (comma separated)</label>
                <Input 
                  name="servicesOffered"
                  value={formData.servicesOffered}
                  onChange={handleChange}
                  placeholder="e.g. Pipe repair, Installation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Hourly Rate (USD)</label>
                <Input 
                  name="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="50"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Location / City</label>
                <Input 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="New York, NY"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Phone</label>
                <Input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {message && (
          <div className={`p-4 rounded-xl ${message.includes("Failed") ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost">Cancel</Button>
          <Button type="submit" isLoading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
