import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Clock, LogOut } from "lucide-react";

// ─── Forgot Password Section ──────────────────────────────────────────────────

function ForgotPasswordSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium underline-offset-2 hover:underline"
        style={{ color: "#0077B6" }}
      >
        Forgot password?
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">Reset your password</p>
      {sent ? (
        <p className="text-sm text-muted-foreground">
          Check your inbox — we sent a reset link to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      ) : (
        <form onSubmit={handleReset} className="space-y-3">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="font-semibold"
              style={{ backgroundColor: "#0077B6" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, signIn, signUp, signOut, pendingApproval } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Redirect if already authenticated
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  // Show pending approval message
  if (pendingApproval) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(135deg, #003f5c 0%, #0077B6 50%, #00b4d8 100%)",
        }}
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1
                className="text-5xl font-black text-white"
                style={{ letterSpacing: "-0.03em" }}
              >
                PPP
              </h1>
              <p className="text-blue-100 text-sm font-medium mt-1 tracking-wide">
                Price per Pound
              </p>
            </div>
          </div>

          {/* Pending approval card */}
          <Card className="shadow-2xl border-0 bg-white/97 backdrop-blur-sm">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="text-center space-y-4">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full"
                  style={{ backgroundColor: "#FF9F1C20" }}
                >
                  <Clock className="h-8 w-8" style={{ color: "#FF9F1C" }} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">
                    Account Pending Approval
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Hi {pendingApproval.displayName}, your account has been created
                    and is waiting for administrator approval.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive access once an admin reviews your registration.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="mt-4"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-blue-200/70 text-xs">
            Professional towing invoice management
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      setLocation("/dashboard");
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }

    setRegLoading(true);
    try {
      await signUp(
        regEmail,
        regPassword,
        regDisplayName || regEmail.split("@")[0]
      );
      setRegSuccess(true);
    } catch (err: unknown) {
      setRegError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #003f5c 0%, #0077B6 50%, #00b4d8 100%)",
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1
              className="text-5xl font-black text-white"
              style={{ letterSpacing: "-0.03em" }}
            >
              PPP
            </h1>
            <p className="text-blue-100 text-sm font-medium mt-1 tracking-wide">
              Price per Pound
            </p>
            <p className="text-blue-200/80 text-xs mt-0.5">
              Invoice Management
            </p>
          </div>
        </div>

        {/* Auth card */}
        <Card className="shadow-2xl border-0 bg-white/97 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-xl font-bold text-foreground">
              Welcome
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to manage your towing invoices
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-5">
                <TabsTrigger value="login" className="flex-1 font-medium">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 font-medium">
                  Register
                </TabsTrigger>
              </TabsList>

              {/* ─── Login Tab ─── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <ForgotPasswordSection />
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                      <p className="text-sm text-destructive">{loginError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full font-semibold mt-1"
                    disabled={loginLoading}
                    style={{ backgroundColor: "#0077B6" }}
                  >
                    {loginLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* ─── Register Tab ─── */}
              <TabsContent value="register">
                {regSuccess ? (
                  <div className="py-6 text-center space-y-2">
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2"
                      style={{ backgroundColor: "#0077B610" }}
                    >
                      <Truck
                        className="h-6 w-6"
                        style={{ color: "#0077B6" }}
                      />
                    </div>
                    <p className="font-semibold text-foreground">
                      Account created!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check your email to confirm your account, then sign in.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">Display Name</Label>
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Your name or business name"
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">Confirm Password</Label>
                      <Input
                        id="reg-confirm"
                        type="password"
                        placeholder="Repeat your password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    {regError && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                        <p className="text-sm text-destructive">{regError}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full font-semibold mt-1"
                      disabled={regLoading}
                      style={{
                        backgroundColor: "#FF9F1C",
                        color: "#1a1a1a",
                      }}
                    >
                      {regLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-blue-200/70 text-xs">
          Professional towing invoice management
        </p>
      </div>
    </div>
  );
}
