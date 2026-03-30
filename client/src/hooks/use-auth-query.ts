import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

/**
 * A convenience hook that automatically injects the auth token from React context
 * into React Query's meta field. This avoids race conditions between React context
 * session state and Supabase's internal session state.
 *
 * The token passed via meta is the same token that triggered `enabled: !!session`,
 * ensuring consistency.
 */
export function useAuthQuery<TData = unknown>(
  queryKey: string[],
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "meta" | "enabled">
) {
  const { session } = useAuth();

  return useQuery<TData>({
    queryKey,
    enabled: !!session,
    meta: { token: session?.access_token },
    ...options,
  });
}
