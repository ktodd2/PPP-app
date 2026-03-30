import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

/**
 * A convenience hook that automatically injects the auth token from React context
 * into React Query's meta field. This avoids race conditions between React context
 * session state and Supabase's internal session state.
 *
 * The token passed via meta is the same token that triggered `enabled: !!session`,
 * ensuring consistency.
 *
 * @param queryKey - The query key (URL is expected as first element)
 * @param options - Standard useQuery options. The `enabled` option is AND'd with session check.
 */
export function useAuthQuery<TData = unknown>(
  queryKey: string[],
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "meta"> & { enabled?: boolean }
) {
  const { session } = useAuth();
  const { enabled: additionalEnabled = true, ...restOptions } = options ?? {};

  return useQuery<TData>({
    queryKey,
    enabled: !!session && additionalEnabled,
    meta: { token: session?.access_token },
    ...restOptions,
  });
}
