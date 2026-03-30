import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: number;
  email: string;
  displayName: string;
  role: string;
  companyId: number | null;
  createdAt: string;
};

type PendingApprovalInfo = {
  displayName: string;
};

type AuthContextType = {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  pendingApproval: PendingApprovalInfo | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalInfo | null>(null);

  // Fetch our app's user profile from the API using the Supabase bearer token.
  async function fetchProfile(activeSession: Session): Promise<void> {
    try {
      const res = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.message === "pending_approval") {
          setPendingApproval({ displayName: data.displayName });
          setUser(null);
          return;
        }
      }

      if (!res.ok) {
        setUser(null);
        setPendingApproval(null);
        return;
      }
      const profile: UserProfile = await res.json();
      setUser(profile);
      setPendingApproval(null);
    } catch {
      setUser(null);
      setPendingApproval(null);
    }
  }

  // Bootstrap: load the existing session, then subscribe to auth state changes.
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const currentSession = data.session ?? null;
      setSession(currentSession);

      if (currentSession) {
        await fetchProfile(currentSession);
      }

      setIsLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession) {
          await fetchProfile(newSession);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ─── Auth actions ───────────────────────────────────────────────────────────

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw new Error(error.message);
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    setSession(null);
    setPendingApproval(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, pendingApproval, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
