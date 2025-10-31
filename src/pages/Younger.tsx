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
      <div className="flex min-h-screen bg-black text-white">
        {/* Sidebar */}
        <div className="w-80 bg-[#1e1e1e] border-r border-gray-800 flex flex-col">
          <div className="p-4">
            <Button onClick={() => navigate("/manage-profile")} className="w-full bg-[#b7b8c4]">
              ← Back
            </Button>
          </div>

          <div className="p-6 border-b border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Younger Profiles</h2>
              <span className="text-sm text-gray-400">{profiles.length} total</span>
            </div>
            <Button onClick={handleAddProfile} className="w-full mb-4 bg-[#b7b8c4] ">
              <Plus className="h-5 w-5 mr-2" /> Add New
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border border-gray-800 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-0 transition"
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
                    : "bg-black border-gray-800 hover:bg-[#1e1e1e] hover:border-gray-600"
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

          {/* Add/Edit Form */}
          {isEditing && (
            <Card className="m-4 bg-black border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">{editingProfile ? "Edit Profile" : "Add New Profile"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {["relationship", "name", "age", "email", "phone", "address", "notes"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="capitalize text-gray-200">
                      {field} {["relationship", "name", "age", "email"].includes(field) && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={field}
                      type={field === "age" ? "number" : "text"}
                      placeholder={`Enter ${field}`}
                      value={(formData as any)[field]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="bg-black border border-gray-800 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-0 transition"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} className="flex-1 bg-black text-white hover:bg-[#1e1e1e]">Save Profile</Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="border-gray-700 text-white hover:bg-[#1e1e1e]/30">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          {selectedProfile ? (
            <div className="space-y-6">
              <Card className="bg-[#1e1e1e] border border-gray-800 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedProfile.name}</h2>
                        <p className="text-gray-400">
                          Relationship: {selectedProfile.relationship || "N/A"} • Age {selectedProfile.age} • Last updated {selectedProfile.lastUpdated}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditProfile(selectedProfile)} className="border-gray-700 text-white hover:bg-[#1e1e1e]/30">
                        <Edit className="h-4 w-4 mr-1 text-gray-400" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteProfile(selectedProfile.id)} className="border-red-600 text-red-600 hover:bg-red-600/20">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-2"><Mail className="text-gray-400" /> {selectedProfile.email}</div>
                    <div className="flex items-center gap-2"><Phone className="text-gray-400" /> {selectedProfile.phone}</div>
                    {selectedProfile.address && <div className="flex items-center gap-2"><MapPin className="text-gray-400" /> {selectedProfile.address}</div>}
                  </div>

                  <div className="bg-black p-4 rounded-md text-sm text-gray-300 mt-4">{selectedProfile.notes || "No additional notes provided."}</div>
                </CardContent>
              </Card>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {featureCards.map((feature, idx) => {
                  const IconComp = feature.icon;
                  return (
                    <Card key={idx} className="bg-[#1e1e1e] border border-gray-800 hover:bg-black hover:border-gray-600 cursor-pointer transition-all duration-200">
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.gradient} mb-4`}>
                          <IconComp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                        <Button onClick={() => navigate(feature.route)} className="w-full mt-2 bg-primary hover:bg-primary/90">Get Started</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Stats */}
              
              
            </div>
          ) : (
            <div className="text-gray-400 text-center mt-20">Select a profile to view details</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
