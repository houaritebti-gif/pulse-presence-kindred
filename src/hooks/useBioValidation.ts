import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ValidationResult {
  valid: boolean;
  message: string | null;
}

/**
 * Hook for real-time bio validation against blacklisted words.
 * Uses a secure endpoint that doesn't reveal the blacklist.
 */
export const useBioValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>("");

  const validateBio = useCallback(async (text: string): Promise<ValidationResult> => {
    // Skip validation for empty or very short text
    if (!text || text.trim().length < 3) {
      const result = { valid: true, message: null };
      setValidationResult(result);
      return result;
    }

    // Skip if text hasn't changed
    if (text === lastTextRef.current && validationResult) {
      return validationResult;
    }

    lastTextRef.current = text;
    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke("validate-bio", {
        body: { text },
      });

      if (error) {
        console.error("Bio validation error:", error);
        // Fail open - allow if we can't validate
        const result = { valid: true, message: null };
        setValidationResult(result);
        return result;
      }

      const result: ValidationResult = {
        valid: data?.valid ?? true,
        message: data?.message ?? null,
      };

      setValidationResult(result);
      return result;
    } catch (err) {
      console.error("Bio validation error:", err);
      const result = { valid: true, message: null };
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [validationResult]);

  const validateBioDebounced = useCallback((text: string) => {
    // Clear any pending validation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce validation to avoid too many requests
    debounceRef.current = setTimeout(() => {
      validateBio(text);
    }, 500);
  }, [validateBio]);

  const reset = useCallback(() => {
    setValidationResult(null);
    setIsValidating(false);
    lastTextRef.current = "";
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    validateBio,
    validateBioDebounced,
    isValidating,
    validationResult,
    isValid: validationResult?.valid ?? true,
    errorMessage: validationResult?.message ?? null,
    reset,
  };
};
