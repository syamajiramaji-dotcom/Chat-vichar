import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGoogle } from "react-icons/si";
import { MessageSquare, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
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
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)" }} />
      <div className="orb-animate-reverse absolute -bottom-[15%] -right-[10%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)" }} />
      <div className="orb-animate absolute top-[40%] right-[5%] w-[30%] h-[30%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-5">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center btn-glow"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
              <MessageSquare className="w-9 h-9 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Chat-vichar</h1>
          <p className="text-muted-foreground mt-2 text-sm">An intimate, personal messaging space.</p>
        </div>

        {/* Auth card — glassmorphism */}
        <div className="glass rounded-2xl overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)" }}>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1.5 rounded-none bg-transparent border-b border-white/[.06]">
              <TabsTrigger
                value="signin"
                className="rounded-xl text-sm font-medium text-muted-foreground data-[state=active]:text-white data-[state=active]:shadow-none"
                style={{ ["--tw-data-active-bg" as string]: "rgba(124,58,237,.25)" }}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-xl text-sm font-medium text-muted-foreground data-[state=active]:text-white data-[state=active]:shadow-none"
              >
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
                  <Input
                    id="signin-email" type="email" placeholder="you@example.com"
                    value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)}
                    required className="bg-white/[.04] border-white/[.08] focus:border-primary/60 h-11 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-xs text-muted-foreground uppercase tracking-wide">Password</Label>
                  <Input
                    id="signin-password" type="password"
                    value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)}
                    required className="bg-white/[.04] border-white/[.08] focus:border-primary/60 h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold btn-glow transition-all active:scale-[.98]"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  disabled={isLoading}
                >
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
                  <Input
                    id="signup-name" placeholder="Jane Doe"
                    value={signUpName} onChange={(e) => setSignUpName(e.target.value)}
                    required className="bg-white/[.04] border-white/[.08] focus:border-primary/60 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input
                    id="signup-email" type="email" placeholder="you@example.com"
                    value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
                    required className="bg-white/[.04] border-white/[.08] focus:border-primary/60 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs text-muted-foreground uppercase tracking-wide">Password</Label>
                  <Input
                    id="signup-password" type="password"
                    value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
                    required minLength={6}
                    className="bg-white/[.04] border-white/[.08] focus:border-primary/60 h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold btn-glow transition-all active:scale-[.98]"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Creating account…" : "Sign Up"}
                </Button>
              </form>
            </TabsContent>

            {/* ── Google ── */}
            <div className="px-6 pb-6">
              <div className="relative my-4 flex items-center">
                <div className="flex-1 border-t border-white/[.07]" />
                <span className="mx-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">or</span>
                <div className="flex-1 border-t border-white/[.07]" />
              </div>
              <Button
                variant="outline" type="button"
                className="w-full h-11 bg-white/[.03] border-white/[.08] hover:bg-white/[.07] text-foreground transition-all"
                onClick={handleGoogle}
              >
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
