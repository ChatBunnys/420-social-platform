import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function useAuth() {
  const { identity, loginStatus, login, clear } = useInternetIdentity();

  const isAuthenticated = loginStatus === "success" && identity !== null;
  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";

  return {
    identity,
    isAuthenticated,
    isLoading,
    loginStatus,
    login,
    logout: clear,
    principal: identity?.getPrincipal() ?? null,
  };
}
