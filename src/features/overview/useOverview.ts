import { useCallback, useEffect, useState } from "react";
import type { OverviewResponse } from "../../types/contracts.js";
import { fetchOverview } from "../../lib/api.js";

export const useOverview = () => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchOverview()); } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Could not load overview"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { data, error, loading, reload: load };
};

