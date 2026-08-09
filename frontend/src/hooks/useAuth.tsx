import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

import { api, type Role, type User } from "@/lib/api";

interface AuthValue {
  user: User | null;
  isLoading: boolean;
  role: Role | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}


const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api.me();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  const user = data ?? null;

  const value: AuthValue = {
    user,
    isLoading,
    role: user?.role ?? null,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    signOut: async () => {
      try {
        await api.logout();
      } catch {
        /* ignore */
      }
      await queryClient.cancelQueries();
      queryClient.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
