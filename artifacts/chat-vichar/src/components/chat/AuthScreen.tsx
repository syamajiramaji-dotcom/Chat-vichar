import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGoogle } from "react-icons/si";
import { MessageSquare, Loader2, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmail(signInEmail, signInPassword);
    } catch (error: unknown) {
      toast({ title: "Sign in failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUpWithEmail(signUpEmail, signUpPassword, signUpName);
    } catch (error: unknown) {
      toast({ title: "Sign up failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      toast({ title: "Google sign in failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Animated gradient orbs */}
      <div className="orb-animate absolute -top-[15%] -left-[10%] w-[50%] h-[50%] rounded-full pointer-events-none"
        style={{ background: "var(--t-orb-1)" }} />
      <div className="orb-animate-reverse absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: "var(--t-orb-2)" }} />
      <div className="orb-animate absolute top-[40%] right-[5%] w-[30%] h-[30%] rounded-full pointer-events-none"
        style={{ background: "var(--t-orb-3)" }} />

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)" }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-5">
            <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center btn-glow"
              style={{ background: "var(--t-gradient-primary)" }}>
              <MessageSquare className="w-9 h-9 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: "var(--t-gradient-primary)" }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Chat-vichar</h1>
          <p className="text-muted-foreground mt-2 text-sm">An intimate, personal messaging space.</p>
        </div>

        {/* Auth card — glassmorphism */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--t-auth-card-bg)",
            border: "1px solid var(--t-auth-card-border)",
            boxShadow: "var(--t-auth-card-shadow)",
            backdropFilter: "blur(20px)"
          }}>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1.5 rounded-none bg-transparent"
              style={{ borderBottom: "1px solid var(--t-divider)" }}>
              <TabsTrigger value="signin"
                className="rounded-xl text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup"
                className="rounded-xl text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* ── Sign In ── */}
            <TabsContent value="signin" className="m-0 p-6 space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground text-sm mt-1">Enter your credentials to continue.</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input id="signin-email" type="email" placeholder="you@example.com"
                    value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)}
                    required className="h-11 bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-xs text-muted-foreground uppercase tracking-wide">Password</Label>
                  <Input id="signin-password" type="password"
                    value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)}
                    required className="h-11 bg-background/50" />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold btn-glow transition-all active:scale-[.98] text-white border-0"
                  style={{ background: "var(--t-gradient-primary)" }}
                  disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* ── Sign Up ── */}
            <TabsContent value="signup" className="m-0 p-6 space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create account</h2>
                <p className="text-muted-foreground text-sm mt-1">Join Chat-vichar to start connecting.</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
                  <Input id="signup-name" placeholder="Jane Doe"
                    value={signUpName} onChange={(e) => setSignUpName(e.target.value)}
                    required className="h-11 bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com"
                    value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
                    required className="h-11 bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs text-muted-foreground uppercase tracking-wide">Password</Label>
                  <Input id="signup-password" type="password"
                    value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
                    required minLength={6} className="h-11 bg-background/50" />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold btn-glow transition-all active:scale-[.98] text-white border-0"
                  style={{ background: "var(--t-gradient-primary)" }}
                  disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Creating account…" : "Sign Up"}
                </Button>
              </form>
            </TabsContent>

            {/* ── Google ── */}
            <div className="px-6 pb-6">
              <div className="relative my-4 flex items-center">
                <div className="flex-1 border-t" style={{ borderColor: "var(--t-divider)" }} />
                <span className="mx-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">or</span>
                <div className="flex-1 border-t" style={{ borderColor: "var(--t-divider)" }} />
              </div>
              <Button variant="outline" type="button"
                className="w-full h-11 hover:bg-background/80 text-foreground transition-all"
                onClick={handleGoogle}>
                <SiGoogle className="mr-2.5 h-4 w-4" />
                Continue with Google
              </Button>
            </div>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
