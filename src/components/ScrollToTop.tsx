import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Small delay to ensure DOM is ready, especially on mobile
    const scrollToTop = () => {
      // Try multiple methods for better mobile compatibility
      if (window.scrollTo) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }
      
      // Direct property assignment for immediate scroll (better for mobile)
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      
      // For iOS Safari mobile
      if (window.scrollY !== undefined) {
        window.scrollTo(0, 0);
      }
      
      // Scroll any scrollable containers to top
      const scrollableElements = document.querySelectorAll('[style*="overflow"], .overflow-y-auto, .overflow-auto');
      scrollableElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.scrollTop = 0;
        }
      });
    };

    // Execute immediately
    scrollToTop();
    
    // Also execute after a tiny delay to catch late renders (especially on mobile)
    const timeoutId = setTimeout(scrollToTop, 0);
    const timeoutId2 = setTimeout(scrollToTop, 50);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [pathname]);

  return null;
};
