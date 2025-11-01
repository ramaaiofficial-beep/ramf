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
  BookOpen,
  Sun,
  Brain,
  Lightbulb,
  CheckCircle2,
  Star,
  TrendingUp
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

export const OmIcon = ({ size = 24, color = "currentColor" }) => (
  <div
    style={{
      fontSize: size,
      color,
      fontWeight: "bold",
      lineHeight: 1,
      display: "inline-block",
      fontFamily: "serif",
    }}
  >
    ॐ
  </div>
);






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

interface Feature {
  title: string;
  description: string;
  route: string;
  icon: React.FC<any>;
  gradient: string;
}

const featureCards: Feature[] = [
  {
    title: "Spiritual  Hub",
    description: "a sacred digital space where stories of Dharma meet the wisdom of AI.",
    route: "/educationY",
    icon: OmIcon,
    gradient: "bg-gradient-to-br from-success to-emerald-600"
  },
  {
    title: "Quizzes & Learning",
    description: "Interactive health content and quizzes.",
    route: "/quizzesY",
    icon: Brain,
    gradient: "bg-gradient-to-br from-purple-600 to-indigo-600"
  },
  {
    title: "AI Learning Assistent",
    description: "Upload PDFs for AI summaries, ask questions, and search YouTube instantly.",
    route: "/general-knowledge",
    icon: Lightbulb,
    gradient: "bg-gradient-to-br from-orange-500 to-yellow-600"
  }
];

export default function Youngers() {
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
    notes: ""
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch profiles
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/youngers/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch")))
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
          lastUpdated: p.lastUpdated
            ? new Date(p.lastUpdated).toLocaleDateString()
            : "Unknown"
        }));
        setProfiles(formatted);
        if (formatted.length > 0) setSelectedProfile(formatted[0]);
      })
      .catch((err) => {
        console.error(err);
        toast({ title: "Error", description: "Failed to fetch younger profiles", variant: "destructive" });
      });
  }, [token, toast]);

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [profiles, searchTerm]
  );

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
      notes: ""
    });
    // Open sidebar on mobile when adding profile
    if (window.innerWidth < 1024) {
      setSidebarOpen(true);
    }
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
      notes: profile.notes || ""
    });
    // Open sidebar on mobile when editing
    if (window.innerWidth < 1024) {
      setSidebarOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.relationship || !formData.name || !formData.age || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Fill all required fields.",
        variant: "destructive"
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
      lastUpdated: new Date().toISOString()
    };

    try {
      if (editingProfile) {
        const res = await fetch(`${API_URL}/youngers/${editingProfile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        updated.lastUpdated = new Date(updated.lastUpdated).toLocaleDateString();
        setProfiles((prev) => prev.map((p) => (p.id === editingProfile.id ? updated : p)));
        setSelectedProfile(updated);
        toast({ title: "Profile Updated", description: "Saved successfully." });
      } else {
        const res = await fetch(`${API_URL}/youngers/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        created.lastUpdated = new Date(created.lastUpdated).toLocaleDateString();
        setProfiles((prev) => [...prev, created]);
        setSelectedProfile(created);
        toast({ title: "Profile Added", description: "Created successfully." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    }

    setIsEditing(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_URL}/youngers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      const newList = profiles.filter((p) => p.id !== id);
      setProfiles(newList);
      if (selectedProfile?.id === id) setSelectedProfile(newList[0] || null);
      toast({ title: "Profile Deleted", description: "Deleted successfully." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete profile.", variant: "destructive" });
    }
  };

  return (
    <Layout showNav>
      <div className="flex min-h-screen bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 blur-3xl opacity-40 pointer-events-none" />

        {/* Mobile overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`z-30 w-72 sm:w-80 bg-[#1e1e1e]/95 backdrop-blur-md border-r border-gray-800 flex-col shadow-2xl ${
          sidebarOpen ? 'fixed inset-y-0 left-0 overflow-y-auto' : 'hidden'
        } lg:flex lg:relative lg:inset-auto lg:shadow-none`}>
          <div className="p-3 sm:p-4 flex items-center justify-between lg:block border-b border-gray-800">
            <Button
              type="button"
              onClick={() => navigate("/manage-profile")}
              className="flex-1 lg:w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-sm"
              size="sm"
            >
              ← Back
            </Button>
            <Button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-2 bg-gray-800 text-white hover:bg-gray-700 transition"
              size="sm"
              variant="ghost"
            >
              ✕
            </Button>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-800 bg-[#131313]/50">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Younger Profiles</h2>
              <span className="text-xs sm:text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded-full">{profiles.length}</span>
            </div>
            <Button
              onClick={handleAddProfile}
              className="w-full mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition shadow-lg"
              size="sm"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add New Profile
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-8 px-4">
                <User className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  {searchTerm ? "No profiles found" : "No profiles yet"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleAddProfile}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Profile
                  </Button>
                )}
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <Card
                  key={profile.id}
                  onClick={() => {
                    setSelectedProfile(profile);
                    setSidebarOpen(false);
                  }}
                  className={`cursor-pointer transition-all duration-300 rounded-lg border ${
                    selectedProfile?.id === profile.id
                      ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600 shadow-lg"
                      : "bg-[#131313] border-gray-800 hover:bg-[#1e1e1e] hover:border-gray-600"
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedProfile?.id === profile.id
                            ? "bg-gradient-to-r from-purple-600 to-blue-600"
                            : "bg-gray-800"
                        }`}>
                          <User className={`h-5 w-5 sm:h-6 sm:w-6 ${
                            selectedProfile?.id === profile.id ? "text-white" : "text-gray-400"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm sm:text-base truncate">{profile.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">
                            {profile.relationship && <span>{profile.relationship} • </span>}
                            Age {profile.age}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add/Edit Form */}
          {isEditing && (
            <div className="p-4 bg-[#131313] border-t border-gray-800 lg:border-t-0 lg:m-4 lg:bg-[#1b1b1b] lg:border lg:rounded-lg">
              <Card className="bg-transparent border-0 shadow-none">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-base sm:text-lg text-white">
                    {editingProfile ? "Edit Profile" : "Add New Profile"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3 sm:space-y-4">
                  {["relationship", "name", "age", "email", "phone", "address", "notes"].map((field) => (
                    <div key={field} className="space-y-1 sm:space-y-2">
                      <Label htmlFor={field} className="capitalize text-gray-200 text-sm">
                        {field === "notes" ? "Notes (Optional)" : field}{" "}
                        {["relationship", "name", "age", "email"].includes(field) && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      {field === "notes" ? (
                        <textarea
                          id={field}
                          placeholder={`Enter ${field}`}
                          value={(formData as any)[field]}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                          className="w-full min-h-[80px] px-3 py-2 bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-md transition text-sm"
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={field}
                          type={field === "age" ? "number" : field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                          placeholder={`Enter ${field}`}
                          value={(formData as any)[field]}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                          className="bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                      size="sm"
                    >
                      Save Profile
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-[#1e1e1e]/30 transition"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="z-10 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
          {/* Mobile Sidebar Toggle Button - scrolls with content */}
          {!sidebarOpen && (
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-xl transition-all duration-200"
                size="sm"
              >
                ☰ Profiles
              </Button>
            </div>
          )}
          {selectedProfile ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Profile Information Section */}
              <div className="space-y-4 sm:space-y-6">
                {/* Profile Header Card */}
                <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                            {selectedProfile.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            {selectedProfile.relationship || "N/A"} • Age {selectedProfile.age} • Updated {selectedProfile.lastUpdated}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProfile(selectedProfile)}
                          className="flex-1 sm:flex-initial border-gray-700 text-white hover:bg-purple-600/20 hover:border-purple-600 transition"
                        >
                          <Edit className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProfile(selectedProfile.id)}
                          className="flex-1 sm:flex-initial border-red-600 text-red-600 hover:bg-red-600/20 transition"
                        >
                          <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm sm:text-base text-white truncate">{selectedProfile.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="text-sm sm:text-base text-white truncate">{selectedProfile.phone || "N/A"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedProfile.address && (
                    <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-lg transition-all duration-200 sm:col-span-2">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">Address</p>
                            <p className="text-sm sm:text-base text-white">{selectedProfile.address}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Notes Card */}
                {selectedProfile.notes && (
                  <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      <p className="text-xs sm:text-sm text-gray-500 mb-3 font-semibold uppercase tracking-wider">Notes</p>
                      <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {selectedProfile.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Divider before Features */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#1e1e1e] px-4 text-sm text-gray-500 font-semibold">Available Features</span>
                </div>
              </div>

              {/* Feature Cards Section */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {featureCards.map((feature, idx) => {
                  const IconComp = feature.icon;
                  return (
                    <Card
                      key={idx}
                      onClick={() => navigate(feature.route)}
                      className="bg-[#1e1e1e] border border-gray-800 hover:bg-[#131313] hover:border-purple-600/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
                    >
                      <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-3">
                        <div
                          className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${feature.gradient} mb-2 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}
                        >
                          <IconComp className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 line-clamp-3">
                          {feature.description}
                        </p>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(feature.route);
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-sm"
                          size="sm"
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 flex items-center justify-center mb-4">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Profile Selected</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-md">
                {profiles.length === 0 
                  ? "Get started by adding your first younger profile"
                  : "Select a profile from the sidebar to view details and access features"}
              </p>
              {profiles.length === 0 && (
                <Button
                  onClick={handleAddProfile}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Profile
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
