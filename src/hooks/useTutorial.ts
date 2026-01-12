import { useState, useCallback } from "react";
import { useLocalStorage, STORAGE_KEYS } from "./useLocalStorage";

const TUTORIAL_SEEN_KEY = "kiki-tutorial-completed";

export const useTutorial = () => {
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage<boolean>(
    TUTORIAL_SEEN_KEY,
    false
  );
  const [isOpen, setIsOpen] = useState(false);

  const openTutorial = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
  }, []);

  const completeTutorial = useCallback(() => {
    setHasSeenTutorial(true);
    setIsOpen(false);
  }, [setHasSeenTutorial]);

  const resetTutorial = useCallback(() => {
    setHasSeenTutorial(false);
  }, [setHasSeenTutorial]);

  // Auto-open for first-time users
  const checkAndOpenForNewUser = useCallback(() => {
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, [hasSeenTutorial]);

  return {
    hasSeenTutorial,
    isOpen,
    openTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial,
    checkAndOpenForNewUser,
  };
};
