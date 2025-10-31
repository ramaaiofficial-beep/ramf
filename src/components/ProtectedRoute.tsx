import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { API_URL } from "@/config/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  autoLogoutMinutes?: number;
}

export const ProtectedRoute = ({ children, autoLogoutMinutes = 5 }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Enable auto-logout ONLY when user is authenticated
  const { resetTimer } = useAutoLogout({ timeoutMinutes: autoLogoutMinutes });

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate("/");
        return;
      }

      // Verify token is valid by calling /auth/me
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setIsAuthenticated(true);
          // Reset the auto-logout timer when auth is verified
          if (resetTimer) {
            resetTimer();
          }
        } else {
          // Token is invalid
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("selectedElderId");
          sessionStorage.removeItem("selectedElderName");
          setIsAuthenticated(false);
          navigate("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("selectedElderId");
        sessionStorage.removeItem("selectedElderName");
        setIsAuthenticated(false);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
};

