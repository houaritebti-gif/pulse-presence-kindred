import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from "react";

interface Announcement {
  message: string;
  priority: "polite" | "assertive";
  id: number;
}

interface AnnouncerContextType {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null);

export const useScreenReaderAnnounce = () => {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error("useScreenReaderAnnounce must be used within ScreenReaderAnnouncerProvider");
  }
  return context;
};

interface ScreenReaderAnnouncerProviderProps {
  children: ReactNode;
}

export const ScreenReaderAnnouncerProvider = ({ children }: ScreenReaderAnnouncerProviderProps) => {
  const [politeAnnouncement, setPoliteAnnouncement] = useState("");
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState("");
  const [announcementId, setAnnouncementId] = useState(0);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Increment ID to force re-render even with same message
    setAnnouncementId(prev => prev + 1);
    
    if (priority === "assertive") {
      setAssertiveAnnouncement(message);
      // Clear after announcement
      setTimeout(() => setAssertiveAnnouncement(""), 1000);
    } else {
      setPoliteAnnouncement(message);
      // Clear after announcement
      setTimeout(() => setPoliteAnnouncement(""), 1000);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements - waits for user to finish current task */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        key={`polite-${announcementId}`}
      >
        {politeAnnouncement}
      </div>
      {/* Assertive announcements - interrupts immediately for urgent updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        key={`assertive-${announcementId}`}
      >
        {assertiveAnnouncement}
      </div>
    </AnnouncerContext.Provider>
  );
};
