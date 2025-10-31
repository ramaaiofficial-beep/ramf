// Elders.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Pill,
  BookOpen,
  Brain,
  Headphones ,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

interface Profile {
  id: string;
  relationship: string;
  name: string;
  age: number;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  lastUpdated?: string;
}

export default function Elders() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    relationship: "",
    name: "",
    age: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/elders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const formatted: Profile[] = data.map((p: any) => ({
          id: p.id,
          relationship: p.relationship ?? "",
          name: p.name,
          age: p.age,
          email: p.email,
          phone: p.phone,
          address: p.address,
          notes: p.notes,
          lastUpdated: p.lastUpdated ?? "",
        }));
        setProfiles(formatted);
        if (formatted.length > 0) {
          setSelectedProfile(formatted[0]);
        }
      })
      .catch((err) => {
        console.error("Fetch elders error:", err);
        toast({
          title: "Error",
          description: "Failed to fetch elder profiles",
          variant: "destructive",
        });
      });
  }, [token, toast]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  const handleAddProfile = () => {
    setIsEditing(true);
    setEditingProfile(null);
    setFormData({
      relationship: "",
      name: "",
      age: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
  };

  const handleEditProfile = (profile: Profile) => {
    setIsEditing(true);
    setEditingProfile(profile);
    setFormData({
      relationship: profile.relationship || "",
      name: profile.name,
      age: profile.age.toString(),
      email: profile.email,
      phone: profile.phone,
      address: profile.address || "",
      notes: profile.notes || "",
    });
  };

  const handleSaveProfile = async () => {
    if (!formData.relationship || !formData.name || !formData.age || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (marked with *).",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      relationship: formData.relationship,
      name: formData.name,
      age: parseInt(formData.age, 10),
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes,
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (editingProfile) {
        const res = await fetch(`${API_URL}/elders/${editingProfile.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setProfiles((prev) =>
          prev.map((p) => (p.id === editingProfile.id ? updated : p))
        );
        setSelectedProfile(updated);
        toast({ title: "Profile Updated", description: "Saved successfully." });
      } else {
        const res = await fetch(`${API_URL}/elders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setProfiles((prev) => [...prev, created]);
        setSelectedProfile(created);
        toast({ title: "Profile Added", description: "Created successfully." });
      }
    } catch (err) {
      console.error("Save profile error:", err);
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive",
      });
    }

    setIsEditing(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = async (id: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this profile?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`${API_URL}/elders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      const newList = profiles.filter((p) => p.id !== id);
      setProfiles(newList);
      if (selectedProfile?.id === id) {
        setSelectedProfile(newList[0] || null);
      }
      toast({ title: "Profile Deleted", description: "Deleted successfully." });
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Error",
        description: "Failed to delete profile.",
        variant: "destructive",
      });
    }
  };

  const handleFeatureNavigation = (route: string) => {
    // Store the selected elder ID in sessionStorage so the feature page can use it
    if (selectedProfile) {
      sessionStorage.setItem("selectedElderId", selectedProfile.id);
      sessionStorage.setItem("selectedElderName", selectedProfile.name);
    }
    navigate(route);
  };

  const featureCards = [
    {
      icon: Pill,
      title: "Medication Management",
      description:
        "Stay on top of your medication schedule with smart reminders and easy tracking.",
      route: "/medications",
      gradient: "bg-gradient-to-br from-purple-600 to-blue-600",
    },
    {
      icon: BookOpen,
      title: "AI health Assistent",
      description:
        "Access your medical notes and get instant help from our AI health assistant.",
      route: "/education",
      gradient: "bg-gradient-to-br from-purple-700 to-indigo-700",
    },
    {
      icon: Brain,
      title: "Quizzes & Learning",
      description:
        "Learn while having fun with engaging and interactive health content.",
      route: "/quizzes",
      gradient: "bg-gradient-to-br from-indigo-600 to-purple-600",
    },
    {
      icon: Headphones,
      title: "Spiritual music Therapy",
      description:
        "Boost emotional well-being with personalized playlists and soothing music experiences.",
      route: "/songs",
      gradient: "bg-gradient-to-br from-pink-600 to-purple-600",
    },
  ];

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return "Unknown";
    const dt = new Date(isoString);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout showNav>
      <div className="flex min-h-screen bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 blur-3xl opacity-40 pointer-events-none" />

        {/* Sidebar */}
        <div className="z-10 w-80 bg-[#1e1e1e] border-r border-gray-800 flex flex-col">
          <div className="p-4">
            <Button
              type="button"
              onClick={() => navigate("/manage-profile", { replace: true })}
              className="w-full bg-[#1e1e1e] text-white hover:bg-purple-600 transition"
            >
              ← Back to Chat
            </Button>
          </div>

          <div className="p-6 border-b border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Elder Profiles</h2>
              <span className="text-sm text-gray-400">{profiles.length} total</span>
            </div>
            <Button
              onClick={handleAddProfile}
              className="w-full mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-transparent border border-gray-800 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-0 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredProfiles.map((profile) => (
              <Card
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={`cursor-pointer transition-all duration-300 rounded-xl border ${
                  selectedProfile?.id === profile.id
                    ? "bg-[#1e1e1e] border-gray-600"
                    : "bg-[#131313] border-gray-800 hover:bg-[#1e1e1e] hover:border-gray-600"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{profile.name}</h3>
                    <p className="text-sm text-gray-400">
                      {profile.relationship ? `${profile.relationship} • ` : ""}
                      Age {profile.age} • {profile.email}
                    </p>
                  </div>
                  <User className="text-gray-400" size={20} />
                </CardContent>
              </Card>
            ))}
          </div>

          {isEditing && (
            <Card className="m-4 bg-[#1b1b1b] border border-gray-800 z-20">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  {editingProfile ? "Edit Profile" : "Add New Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "relationship",
                  "name",
                  "age",
                  "email",
                  "phone",
                  "address",
                  "notes",
                ].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="capitalize text-gray-200">
                      {field}{" "}
                      {["relationship", "name", "age", "email"].includes(field) && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <Input
                      id={field}
                      type={field === "age" ? "number" : "text"}
                      placeholder={`Enter ${field}`}
                      value={(formData as any)[field]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className="bg-transparent border border-gray-800 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-0 transition"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                  >
                    Save Profile
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-[#1e1e1e]/30 transition"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="z-10 flex-1 p-8 overflow-y-auto space-y-6">
          {selectedProfile ? (
            <div className="space-y-6">
              <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#131313] rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedProfile.name}
                        </h2>
                        <p className="text-gray-400">
                          Relationship: {selectedProfile.relationship || "N/A"} • Age{" "}
                          {selectedProfile.age} • Last updated {formatDate(selectedProfile.lastUpdated)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProfile(selectedProfile)}
                        className="border-gray-700 text-white hover:bg-[#1e1e1e]/30 transition"
                      >
                        <Edit className="h-4 w-4 mr-1 text-gray-400" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProfile(selectedProfile.id)}
                        className="border-red-600 text-red-600 hover:bg-red-600/20 transition"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Mail className="text-gray-400" />
                      {selectedProfile.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="text-gray-400" />
                      {selectedProfile.phone}
                    </div>
                    {selectedProfile.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="text-gray-400" />
                        {selectedProfile.address}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#131313] p-4 rounded-md text-sm text-gray-300 mt-4">
                    {selectedProfile.notes || "No additional notes provided."}
                  </div>
                </CardContent>
              </Card>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {featureCards.map((feature, idx) => {
                  const IconComp = feature.icon;
                  return (
                    <Card
                      key={idx}
                      className="bg-[#1e1e1e] border border-gray-800 hover:bg-[#131313] hover:border-gray-600 cursor-pointer transition-all duration-200"
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                        <div
                          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.gradient} mb-4`}
                        >
                          <IconComp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {feature.description}
                        </p>
                        <Button
                          onClick={() => handleFeatureNavigation(feature.route)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center mt-20">
              Select a profile to view details
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
