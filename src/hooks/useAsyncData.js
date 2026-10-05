import { useCallback, useEffect, useRef, useState } from "react";

export function useAsyncData(loader, dependencies = [], options = {}) {
  const [data, setData] = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent && data != null) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const next = await loader();
      if (mounted.current) setData(next);
      return next;
    } catch (nextError) {
      if (mounted.current) setError(nextError);
      throw nextError;
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load().catch(() => {}); }, [load]);

  return { data, setData, loading, refreshing, error, reload: load };
}
