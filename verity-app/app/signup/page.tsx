"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FloatingPathsBackground } from "@/components/ui/floating-paths";
import { auth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = password.length >= 10 ? "Strong" : password.length >= 6 ? "Good" : password.length > 0 ? "Weak" : "";
  const strengthColor = password.length >= 10 ? "text-emerald-400" : password.length >= 6 ? "text-sky-400" : "text-amber-400";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.signUp(fullName, email, password);
      // Directly log in and enter dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-black relative overflow-hidden">
      {/* Animated floating paths background */}
      <FloatingPathsBackground position={0.5} className="absolute inset-0">
        <div />
      </FloatingPathsBackground>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 mb-3">
            <Image
              src="/logo.png"
              alt="VERITY"
              width={52}
              height={52}
              className="rounded-xl object-contain shadow-[0_0_25px_rgba(56,189,248,0.25)]"
              priority
            />
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">VERITY</span>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-mono -mt-0.5">Evidence Engine</p>
            </div>
          </Link>
          <p className="text-white/50 text-xs sm:text-sm">Create your research account</p>
        </div>

        <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.8)]">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-center text-white text-base sm:text-lg font-semibold">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 text-xs py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-white/70 text-xs sm:text-sm">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Dr. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20 text-sm h-10"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-xs sm:text-sm">Work or Academic Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="alex@institution.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20 text-sm h-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70 text-xs sm:text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20 text-sm h-10"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 w-7 rounded-full transition-all ${
                            password.length >= 6 && i <= (password.length >= 10 ? 3 : password.length >= 6 ? 2 : 1)
                              ? password.length >= 10
                                ? "bg-emerald-400"
                                : "bg-sky-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-mono ${strengthColor}`}>{passwordStrength}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-white/30 font-mono pt-1">
                <Shield className="w-3 h-3 text-sky-400/70" />
                <span>Instant Activation · Grounded Evidence</span>
              </div>

              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-black font-semibold h-11 text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Create Account & Enter
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs sm:text-sm text-white/40 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
