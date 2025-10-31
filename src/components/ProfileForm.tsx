import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/config/api";

export function ProfileForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        // Try to parse error message from response
        let errorMsg = "Failed to save details";
        try {
          const errorData = await res.json();
          errorMsg = errorData.detail || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      setMessage("Saved!");
    } catch (err: any) {
      setMessage(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user info on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setForm({
            username: data.username,
            email: data.email,
            phone: data.phone,
          });
          firstInputRef.current?.focus();
        } else {
          console.error("Failed to fetch profile:", data.detail || data);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };
    fetchProfile();
  }, []);

  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="absolute top-10 right-0 w-64 z-50">
      <div
        ref={formRef}
        className="bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700 relative"
      >
        <h2 className="text-white text-lg font-semibold mb-4">Update Profile</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={firstInputRef}
            type="text"
            name="username"
            placeholder="Name"
            value={form.username}
            onChange={handleChange}
            className="p-2 rounded-md bg-black text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-2 rounded-md bg-black text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="p-2 rounded-md bg-black text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black hover:bg-gray-800 text-white p-2 rounded-md text-sm transition-all duration-150"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          {message && (
            <p
              className={`text-xs mt-1 ${
                message === "Saved!" ? "text-green-400" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </form>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-sm"
          aria-label="Close profile form"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
