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
// Accepts an optional token parameter to avoid race conditions with React context.

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
  token?: string | null
): Promise<Response> {
  // Use provided token, or fall back to fetching from Supabase
  const authToken = token ?? (await getBearerToken());

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
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
// Reads token from meta to avoid race conditions between React context and Supabase.

const defaultQueryFn: QueryFunction = async ({ queryKey, meta }) => {
  const url = queryKey[0] as string;
  const token = (meta as { token?: string } | undefined)?.token;
  const res = await fetchWithAuth(url, {}, token);
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
      // Retry on 401 errors to handle race conditions during auth state changes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.startsWith("401")) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(500 * (attemptIndex + 1), 2000),
    },
    mutations: {
      retry: false,
    },
  },
});
