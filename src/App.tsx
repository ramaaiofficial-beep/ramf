import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Elders from "./pages/Elders";
import Younger from "./pages/Younger";
import NotFound from "./pages/NotFound";

// Feature pages
import Medications from "./pages/Medications";
import Education from "./pages/Education";
import Quizzes from "./pages/Quizzes";
import QuizTaker from "./pages/QuizTaker";
import EducationY from "./pages/EducationY";
import GeneralKnowledge from "./pages/GeneralKnowledge";
import QuizzesY from "./pages/QuizzesY"; 
import QuizTakerY from "./pages/QuizTakerY";
import ManageProfile from "./pages/ManageProfile";
import SongPage from "./pages/SongPage";
import PrescriptionReader from "./pages/PrescriptionReader";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VoiceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            {/* All protected routes */}
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/elders" element={<ProtectedRoute><Elders /></ProtectedRoute>} />
            <Route path="/younger" element={<ProtectedRoute><Younger /></ProtectedRoute>} />
            {/* Feature pages */}
            <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
            <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
            <Route path="/educationY" element={<ProtectedRoute><EducationY /></ProtectedRoute>} />
            <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
            <Route path="/quizzesY" element={<ProtectedRoute><QuizzesY /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><QuizTaker /></ProtectedRoute>} />
            <Route path="/quizY" element={<ProtectedRoute><QuizTakerY /></ProtectedRoute>} />
            <Route path="/general-knowledge" element={<ProtectedRoute><GeneralKnowledge /></ProtectedRoute>} />
            <Route path="/manage-profile" element={<ProtectedRoute><ManageProfile /></ProtectedRoute>} />
            <Route path="/songs" element={<ProtectedRoute><SongPage /></ProtectedRoute>} />
            <Route path="/prescription" element={<ProtectedRoute><PrescriptionReader /></ProtectedRoute>} />


            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VoiceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;