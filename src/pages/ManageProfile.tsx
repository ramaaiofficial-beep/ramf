import { Smile, UserCog, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout"; // ✅ Import Layout

const ManageProfile = () => {
  const navigate = useNavigate();

  return (
    <Layout showNav={true}> {/* ✅ Adds the navbar on top */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 relative overflow-hidden">
        {/* Match Chat ambient gradient pulse background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-black to-blue-800/20 blur-3xl" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md shadow-lg transition rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center mb-10 mt-10">
          <h1 className="text-3xl font-bold text-white mb-2">Manage Profile</h1>
          <p className="text-gray-400 text-sm">
            Choose a profile category to manage preferences.
          </p>
        </div>

        {/* Two glossy cards */}
        <div className="relative z-10 flex flex-wrap justify-center gap-6 pb-20">
          {/* Elder Card */}
          <div
            onClick={() => navigate("/elders")}
            className="cursor-pointer w-[220px] h-[150px] bg-[#1e1e1e]/70 backdrop-blur-md rounded-2xl p-6 text-white border border-gray-800 shadow-lg hover:shadow-purple-600/40 hover:scale-105 transition-transform"
          >
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white shadow-md">
              <UserCog className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">Elder</h2>
            <p className="text-sm text-gray-400 mt-1">Manage elder profiles</p>
          </div>

          {/* Younger Card */}
          <div
            onClick={() => navigate("/younger")}
            className="cursor-pointer w-[220px] h-[150px] bg-[#1e1e1e]/70 backdrop-blur-md rounded-2xl p-6 text-white border border-gray-800 shadow-lg hover:shadow-blue-600/40 hover:scale-105 transition-transform"
          >
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white shadow-md">
              <Smile className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">Younger</h2>
            <p className="text-sm text-gray-400 mt-1">Manage younger profiles</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManageProfile;
