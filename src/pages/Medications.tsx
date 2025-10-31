import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Clock,
  Calendar,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

// --- Gemini API Details ---
const GEMINI_API_KEY = "AIzaSyAQZRsBJZg40AG208w_pVou0_OISnytYGY";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  phone_number: string;
}

const Medications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    time: "",
    frequency: "Every day",
    phone_number: "",
  });

  const [pendingMeds, setPendingMeds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get the selected elder from sessionStorage
  const selectedElderId = typeof window !== "undefined" ? sessionStorage.getItem("selectedElderId") : null;
  const selectedElderName = typeof window !== "undefined" ? sessionStorage.getItem("selectedElderName") : null;

  // Fetch reminders function - now exported so it can be called from anywhere
  const fetchReminders = async () => {
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      console.log("Fetching reminders, token:", token ? "Present" : "Missing");
      
      if (!token) {
        console.error("No token found - user not logged in");
        toast({
          title: "Please Log In",
          description: "You must be logged in to view medications.",
          variant: "destructive",
        });
        return;
      }
      
      // Build URL with elder_id filter if available
      let url = `${API_URL}/medications/reminders`;
      if (selectedElderId) {
        url += `?elder_id=${selectedElderId}`;
        console.log("Filtering by elder_id:", selectedElderId);
      } else {
        console.log("Not filtering by elder_id - fetching all reminders");
      }
      
      console.log("Fetching from URL:", url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to fetch reminders:", errorData);
        throw new Error(`Failed to fetch reminders: ${res.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await res.json();
      console.log("Received data:", data);
      console.log("Number of reminders received:", data.length);

      const loaded = data.map((r: any) => ({
        id: r.id,
        name: r.medication_name,
        dosage: r.dosage,
        time: new Date(r.send_time).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        frequency: r.frequency || "Every day",
        phone_number: r.phone_number || "-",
      }));

      console.log("Loaded medications:", loaded);
      console.log("Setting medications state with count:", loaded.length);
      setMedications(loaded);
    } catch (error) {
      console.error("Error in fetchReminders:", error);
      toast({
        title: "Error",
        description: "Could not load reminders.",
        variant: "destructive",
      });
    }
  };

  // --- Load reminders from backend on mount ---
  useEffect(() => {
    // Fetch immediately and also set up a refresh interval
    fetchReminders();
    
    // Re-fetch when page gains focus (in case user switched accounts in another tab)
    const handleFocus = () => {
      console.log("Window focused, refreshing reminders...");
      fetchReminders();
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [toast]);

  // --- Convert File to Base64 ---
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // --- Upload Prescription to Gemini ---
  const handlePrescriptionUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please upload a prescription image first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const base64Image = await fileToBase64(file);

      const prompt = `
      You are an expert OCR and prescription reader. The uploaded image might contain a table or list of medicines.
      Carefully read all rows and return ONLY a JSON array of medicines with the exact fields:

      [
        { "name": "Paracetamol", "dosage": "650mg", "frequency": "1-0-1" },
        { "name": "Acetaminophen", "dosage": "200mg", "frequency": "1-1-1" },
        ...
      ]

      - 'frequency' can be formats like "1-0-1", "3 times a day", or "2X".
      - Ignore table borders or headers.
      - Do not include explanations or text outside JSON.
      - If a medicine name or dosage is unclear, skip that row.
      - Extract clean, readable text.
      `;

      const body = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Image.split(",")[1],
                },
              },
              { text: prompt },
            ],
          },
        ],
      };

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) throw new Error("No response from Gemini");

      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      const jsonText = text.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonText);

      if (parsed.length > 0) {
        setPendingMeds(parsed);
        setCurrentIndex(0);
        setFormData({
          name: parsed[0].name || "",
          dosage: parsed[0].dosage || "",
          time: "",
          frequency: parsed[0].frequency || "Every day",
          phone_number: "",
        });
        setShowAddForm(true);
        toast({
          title: "Success",
          description:
            "Prescription extracted successfully. Confirm each medicine to save.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to process prescription image.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Confirm & Save Medication ---
  const handleAddMedication = async () => {
    if (!formData.name || !formData.dosage || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill name, dosage, and time.",
        variant: "destructive",
      });
      return;
    }

    const confirm = window.confirm("Confirm and schedule this medication?");
    if (!confirm) return;

    if (!formData.phone_number) {
      toast({
        title: "Missing Info",
        description: "Please enter a phone number before saving.",
        variant: "destructive",
      });
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      ...formData,
    };

    setMedications((prev) => [...prev, newMed]);

    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Error",
          description: "Please log in to add medications.",
          variant: "destructive",
        });
        return;
      }
      
      const res = await fetch(
        `${API_URL}/medications/schedule-reminder`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            patient_name: selectedElderName || "Elder User",
            medication_name: formData.name,
            dosage: formData.dosage,
            send_time: formData.time,
            frequency: formData.frequency,
            phone_number: formData.phone_number,
            ...(selectedElderId && { elder_id: selectedElderId }),
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to save medication");
      }
      
      toast({
        title: "Saved",
        description: "Medication scheduled successfully.",
      });
      
      // Refresh the medications list from backend
      console.log("Fetching reminders after successful save...");
      await fetchReminders();
      console.log("Reminders fetched, current medications count:", medications.length);
    } catch {
      toast({
        title: "Error",
        description: "Could not connect to backend.",
        variant: "destructive",
      });
    }

    if (currentIndex + 1 < pendingMeds.length) {
      const next = pendingMeds[currentIndex + 1];
      setFormData({
        name: next.name || "",
        dosage: next.dosage || "",
        time: "",
        frequency: next.frequency || "Every day",
        phone_number: "",
      });
      setCurrentIndex(currentIndex + 1);
      toast({
        title: "Next Medication",
        description: `Please confirm next medicine (${next.name}).`,
      });
    } else {
      setPendingMeds([]);
      setShowAddForm(false);
      toast({
        title: "Done",
        description: "All medications confirmed and saved.",
      });
    }
  };

  // --- Delete Medication ---
  const handleDeleteMedication = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Error",
          description: "Please log in to delete medications.",
          variant: "destructive",
        });
        return;
      }
      
      const res = await fetch(
        `${API_URL}/medications/reminders/${id}`,
        { 
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error();
      setMedications(medications.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: "Medication removed." });
    } catch {
      toast({
        title: "Error",
        description: "Could not delete medication.",
        variant: "destructive",
      });
    }
  };

  // --- Stats ---
  const totalMedications = medications.length;
  const completedToday = 0;
  const remaining = totalMedications - completedToday;

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/elders")}
            className="mr-4 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Medication Management</h1>
            <p className="text-gray-400 mt-2">
              {selectedElderName ? (
                <>Managing medications for <span className="font-semibold text-purple-400">{selectedElderName}</span></>
              ) : (
                <>Upload a prescription or add medications manually.</>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-[#2a2a2a] border border-gray-700 text-center">
            <div className="text-3xl font-bold mb-2">{totalMedications}</div>
            <div className="text-sm text-gray-400">Total Medications</div>
          </Card>
          <Card className="p-6 bg-[#2a2a2a] border border-gray-700 text-center">
            <div className="text-3xl font-bold mb-2">{completedToday}</div>
            <div className="text-sm text-gray-400">Completed Today</div>
          </Card>
          <Card className="p-6 bg-[#2a2a2a] border border-gray-700 text-center">
            <div className="text-3xl font-bold mb-2">{remaining}</div>
            <div className="text-sm text-gray-400">Remaining</div>
          </Card>
        </div>

        {/* Upload & Add Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Medication
          </Button>

          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="bg-[#2a2a2a] border-gray-700 text-white w-60"
            />
            <Button
              onClick={handlePrescriptionUpload}
              disabled={!file || loading}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" /> Upload Prescription
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="p-6 mb-8 bg-[#2a2a2a] border border-gray-700">
            <h3 className="text-xl font-bold mb-6">
              {pendingMeds.length > 0
                ? `Confirm Medicine (${currentIndex + 1}/${pendingMeds.length})`
                : "Add New Medication"}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label>Medication Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-[#1e1e1e] border-gray-600 text-white"
                />
              </div>
              <div>
                <label>Dosage</label>
                <Input
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  className="bg-[#1e1e1e] border-gray-600 text-white"
                />
              </div>
              <div>
                <label>Time</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="bg-[#1e1e1e] border-gray-600 text-white"
                />
              </div>
              <div>
                <label>Frequency</label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger className="bg-[#1e1e1e] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectItem value="1-0-1">1-0-1</SelectItem>
                    <SelectItem value="0-1-1">0-1-1</SelectItem>
                    <SelectItem value="1-1-0">1-1-0</SelectItem>
                    <SelectItem value="1-1-1">1-1-1</SelectItem>
                    <SelectItem value="1-0-0">1-0-0</SelectItem>
                    <SelectItem value="0-1-0">0-1-0</SelectItem>
                    <SelectItem value="1X">1X</SelectItem>
                    <SelectItem value="2X">2X</SelectItem>
                    <SelectItem value="3X">3X</SelectItem>
                    <SelectItem value="1 time a day">1 time a day</SelectItem>
                    <SelectItem value="2 times a day">
                      2 times a day
                    </SelectItem>
                    <SelectItem value="3 times a day">
                      3 times a day
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label>Phone Number</label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="e.g. +919876543210"
                  className="bg-[#1e1e1e] border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleAddMedication}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                Confirm & Schedule
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Medication Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {medications.map((m) => (
            <Card
              key={m.id}
              className="p-6 bg-[#2a2a2a] border border-gray-700 text-white"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">{m.name}</h3>
                <Button
                  variant="ghost"
                  className="p-1 text-red-500 hover:bg-red-800"
                  onClick={() => handleDeleteMedication(m.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                Dosage: {m.dosage}
              </div>
              <div className="flex items-center text-gray-400 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span>{m.time || "--:--"}</span>
              </div>
              <div className="flex items-center text-gray-400 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{m.frequency}</span>
              </div>
              <div className="text-sm text-gray-400">
                Phone: {m.phone_number || "-"}
              </div>
            </Card>
          ))}
          {medications.length === 0 && (
            <div className="text-center col-span-full text-gray-400 mt-8">
              No medications scheduled yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Medications;
