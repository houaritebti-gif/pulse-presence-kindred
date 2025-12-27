import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { playSuccessSound } from "@/utils/notificationSound";

interface UseRetrySuccessToastOptions {
  isError: boolean;
  isLoading: boolean;
  isFetching: boolean;
  data: unknown;
  successMessage?: string;
  playSound?: boolean;
}

export const useRetrySuccessToast = ({
  isError,
  isLoading,
  isFetching,
  data,
  successMessage = "Datos cargados correctamente",
  playSound = true,
}: UseRetrySuccessToastOptions) => {
  const wasError = useRef(false);

  useEffect(() => {
    if (isError) {
      wasError.current = true;
    } else if (wasError.current && !isLoading && !isFetching && data !== undefined) {
      wasError.current = false;
      toast.success(successMessage);
      if (playSound) {
        playSuccessSound();
      }
    }
  }, [isError, isLoading, isFetching, data, successMessage, playSound]);
};
