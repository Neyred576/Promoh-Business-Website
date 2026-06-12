"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Upload, Phone, Mail } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function VerificationCenterPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadStatus() {
      if (!user?.uid) return;
      const docSnap = await getDoc(doc(db, "providers", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStatus(data.status || "Pending");
        if (data.verificationDocumentUrl) {
          setDocumentUrl(data.verificationDocumentUrl);
        }
      }
      setLoading(false);
    }
    loadStatus();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=3a8672d6f05b114ce3c0c6e81c8bd9fe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setDocumentUrl(data.data.url);
        // Automatically save the URL to Firestore so they don't lose it if they refresh
        if (user?.uid) {
          await updateDoc(doc(db, "providers", user.uid), { verificationDocumentUrl: data.data.url });
        }
      } else {
        alert("Failed to upload document.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentSubmit = async () => {
    if (!user?.uid || !documentUrl) return;
    await updateDoc(doc(db, "providers", user.uid), {
      status: "Under Review"
    });
    setStatus("Under Review");
    alert("Documents submitted for review!");
  };

  if (loading) return <div className="p-8">Loading verification status...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Center</h1>
          <p className="text-secondary-600 mt-1">Submit your documents to become a verified Promoh professional.</p>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium ${
          status === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
          status === "Under Review" ? "bg-blue-50 text-blue-700 border-blue-200" :
          status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
          "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {status === "Approved" && <CheckCircle className="w-5 h-5" />}
          {status !== "Approved" && <AlertCircle className="w-5 h-5" />}
          Status: {status}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary-600" /> Email Verification</CardTitle>
            <CardDescription>Verify your email address for account security.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-secondary-900 font-medium">{user?.email}</span>
            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 pointer-events-none">Verified</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary-600" /> Identity Document Upload</CardTitle>
            <CardDescription>Upload a government-issued ID (Passport, Driver's License, or National ID).</CardDescription>
          </CardHeader>
          <CardContent>
            {documentUrl ? (
              <div className="mb-4">
                <p className="text-sm text-green-600 font-medium mb-2">✅ Document Uploaded Successfully</p>
                <img src={documentUrl} alt="ID Document" className="max-h-48 rounded-lg border border-secondary-200 object-cover" />
              </div>
            ) : null}

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed ${uploading ? "border-primary-400 bg-primary-50" : "border-secondary-300 bg-white hover:bg-secondary-50"} rounded-xl p-8 text-center transition-colors cursor-pointer`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-4 ${uploading ? "text-primary-500 animate-bounce" : "text-secondary-400"}`} />
              <p className="font-medium text-secondary-900">{uploading ? "Uploading securely..." : "Click to select document image"}</p>
              <p className="text-sm text-secondary-500 mt-1">JPEG or PNG only</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleDocumentSubmit} 
                disabled={status === "Under Review" || status === "Approved" || !documentUrl}
              >
                {status === "Under Review" ? "Currently Under Review" : status === "Approved" ? "Verified" : "Submit for Verification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
