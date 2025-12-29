import { useState, useCallback } from "react";

/**
 * Hook to check if a password has been exposed in data breaches
 * using the Have I Been Pwned API with k-anonymity (safe to use)
 */
export const usePasswordBreachCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [breachCount, setBreachCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Hash a password using SHA-1 (required by HIBP API)
   */
  const sha1Hash = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  };

  /**
   * Check if password has been exposed in known data breaches
   * Uses k-anonymity: only sends first 5 chars of hash to API
   */
  const checkPassword = useCallback(async (password: string): Promise<number> => {
    if (!password || password.length < 4) {
      setBreachCount(null);
      return 0;
    }

    setIsChecking(true);
    setError(null);

    try {
      const hash = await sha1Hash(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          headers: {
            "Add-Padding": "true", // Helps prevent timing attacks
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al verificar la contraseña");
      }

      const text = await response.text();
      const lines = text.split("\n");

      for (const line of lines) {
        const [hashSuffix, count] = line.split(":");
        if (hashSuffix.trim() === suffix) {
          const breachNum = parseInt(count.trim(), 10);
          setBreachCount(breachNum);
          return breachNum;
        }
      }

      setBreachCount(0);
      return 0;
    } catch (err) {
      console.error("HIBP check error:", err);
      setError("No se pudo verificar la contraseña");
      setBreachCount(null);
      return -1; // Indicates error, not a breach count
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setBreachCount(null);
    setError(null);
    setIsChecking(false);
  }, []);

  return {
    checkPassword,
    isChecking,
    breachCount,
    error,
    reset,
    isBreached: breachCount !== null && breachCount > 0,
  };
};
