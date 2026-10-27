import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiJson } from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  xp: number;
  level: number;
  theme: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("lifexp_token"));
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    if (!token) { setUser(null); setIsLoading(false); return; }
    try {
      const me = await apiJson<User>("/api/v1/auth/me");
      setUser(me);
    } catch {
      setUser(null);
      localStorage.removeItem("lifexp_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiJson<{ accessToken: string; user: User }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("lifexp_token", data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name?: string }) => {
    await apiJson("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }, []);

  const logout = useCallback(async () => {
    try { await apiJson("/api/v1/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    localStorage.removeItem("lifexp_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
