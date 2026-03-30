import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getBearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ─── fetchWithAuth ────────────────────────────────────────────────────────────
// A fetch wrapper that automatically injects the Supabase bearer token.
// Usable for both query functions (pass URL string) and mutations (pass full
// RequestInit alongside the URL).

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getBearerToken();

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...init, headers });
  await throwIfResNotOk(res);
  return res;
}

// ─── Default query function ───────────────────────────────────────────────────
// Uses the first element of the query key as the URL (standard React Query
// convention). Returns parsed JSON.

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = queryKey[0] as string;
  const res = await fetchWithAuth(url);
  return res.json();
};

// ─── QueryClient ──────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
