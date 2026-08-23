import { useCallback, useState } from "react";

export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(
    action: () => Promise<T>,
    options: { rethrow?: boolean } = {},
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error inesperado.");
      if (options.rethrow) throw err;
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, run, setError };
}
