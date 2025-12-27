import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseRetrySuccessToastOptions {
  isError: boolean;
  isLoading: boolean;
  isFetching: boolean;
  data: unknown;
  successMessage?: string;
}

export const useRetrySuccessToast = ({
  isError,
  isLoading,
  isFetching,
  data,
  successMessage = "Datos cargados correctamente",
}: UseRetrySuccessToastOptions) => {
  const wasError = useRef(false);

  useEffect(() => {
    if (isError) {
      wasError.current = true;
    } else if (wasError.current && !isLoading && !isFetching && data !== undefined) {
      wasError.current = false;
      toast.success(successMessage);
    }
  }, [isError, isLoading, isFetching, data, successMessage]);
};
