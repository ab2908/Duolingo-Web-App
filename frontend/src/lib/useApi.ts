"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

/** Minimal data-fetching hook: loads on mount and exposes a ``reload``. */
export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetcher());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
    // The fetcher is expected to be a stable api.* function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load on mount
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
