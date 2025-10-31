import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface UseAutoLogoutOptions {
  timeoutMinutes?: number;
}

export const useAutoLogout = ({ timeoutMinutes = 5 }: UseAutoLogoutOptions = {}) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutDuration = timeoutMinutes * 60 * 1000; // Convert to milliseconds

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    // Set up warning timeout (30 seconds before logout)
    const warningTime = timeoutDuration - 30000; // 30 seconds before logout
    if (warningTime > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        // Optional: Show a warning to the user
        console.log("You will be logged out due to inactivity in 30 seconds");
        // You can add a toast notification here if desired
      }, warningTime);
    }

    // Set up logout timeout
    timeoutRef.current = setTimeout(() => {
      // Clear session storage
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("selectedElderId");
      sessionStorage.removeItem("selectedElderName");
      
      // Redirect to login
      navigate("/", { replace: true });
    }, timeoutDuration);
  }, [timeoutDuration, navigate, clearTimers]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    // Initialize timer on mount
    resetTimer();

    // Add event listeners
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [resetTimer, clearTimers]);

  // Reset timer when component mounts or user becomes active
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return { resetTimer };
};


