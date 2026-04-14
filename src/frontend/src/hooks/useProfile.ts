import type { UserProfile } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useBackend } from "./useBackend";

export function useProfile() {
  const { principal, isAuthenticated } = useAuth();
  const { actor, isLoading: actorLoading } = useBackend();

  const query = useQuery<UserProfile | null>({
    queryKey: ["profile", principal?.toText()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !!principal && isAuthenticated && !actorLoading,
    staleTime: 30_000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    hasProfile: query.data !== null && query.data !== undefined,
  };
}
