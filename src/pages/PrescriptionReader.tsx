import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

// === Gemini API Constants ===
const GEMINI_API_KEY = "AIzaSyAQZRsBJZg40AG208w_pVou0_OISnytYGY";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const PrescriptionReader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Convert image to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a prescription image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Image = await fileToBase64(file);

      const prompt = `
        You are a medical assistant. Read the uploaded prescription image and extract a structured JSON array 
        of medicines with fields:
        - name
        - dosage (e.g., "500mg")
        - frequency (like "1-0-1" or "0-1-1" etc.)
        - notes (optional)

        Example Output:
        [
          { "name": "Paracetamol", "dosage": "500mg", "frequency": "1-0-1" },
          { "name": "Amoxicillin", "dosage": "250mg", "frequency": "0-1-1" }
        ]

        Return ONLY the JSON array, no explanation.`;

      // Prepare request body
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

      const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // Extract response text
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) {
        throw new Error("No text returned from Gemini.");
      }

      // Try to extract JSON
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      const jsonText = text.slice(jsonStart, jsonEnd);
      const parsedMedicines: Medicine[] = JSON.parse(jsonText);

      setMedicines(parsedMedicines);
    } catch (err: any) {
      console.error("Error reading prescription:", err);
      setError("Failed to analyze the prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Prescription Reader</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Upload Prescription Image</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Analyzing...
              </>
            ) : (
              <>
                <Upload className="mr-2" /> Upload & Analyze
              </>
            )}
          </Button>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {medicines.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">
                Extracted Medicines
              </h2>
              <table className="w-full border border-gray-300 rounded-md text-sm">
                <thead className="bg-black-100">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Dosage</th>
                    <th className="p-2 text-left">Frequency</th>
                    <th className="p-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{med.name}</td>
                      <td className="p-2">{med.dosage}</td>
                      <td className="p-2">{med.frequency}</td>
                      <td className="p-2">{med.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionReader;
