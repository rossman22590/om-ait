"use client";

import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState, useEffect, useRef, Suspense } from "react";
import { useScroll } from "motion/react";
import { signIn, signUp, forgotPassword } from "./actions";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, X, CheckCircle, AlertCircle, MailCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const mode = searchParams.get("mode");
  const returnUrl = searchParams.get("returnUrl");
  const message = searchParams.get("message");
  
  const isSignUp = mode === 'signup';
  const tablet = useMediaQuery("(max-width: 1024px)");
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();
  
  // Redirect if user is already logged in, checking isLoading state
  useEffect(() => {
    if (!isLoading && user) {
      router.push(returnUrl || '/dashboard');
    }
  }, [user, isLoading, router, returnUrl]);
  
  // Determine if message is a success message
  const isSuccessMessage = message && (
    message.includes("Check your email") || 
    message.includes("Account created") ||
    message.includes("success")
  );
  
  // Registration success state
  const [registrationSuccess, setRegistrationSuccess] = useState(!!isSuccessMessage);
  const [registrationEmail, setRegistrationEmail] = useState("");
  
  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set registration success state from URL params
  useEffect(() => {
    if (isSuccessMessage) {
      setRegistrationSuccess(true);
    }
  }, [isSuccessMessage]);

  // Detect when scrolling is active to reduce animation complexity
  useEffect(() => {
    const unsubscribe = scrollY.on("change", () => {
      setIsScrolling(true);
      
      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Set a new timeout
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300); // Wait 300ms after scroll stops
    });
    
    return () => {
      unsubscribe();
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [scrollY]);

  const handleSignIn = async (prevState: any, formData: FormData) => {
    if (returnUrl) {
      formData.append("returnUrl", returnUrl);
    }
    const result = await signIn(prevState, formData);
    
    // Handle the success response with manual redirect
    if (result && result.success && result.redirect) {
      // Add a small delay to ensure session is properly saved
      setTimeout(() => {
        window.location.href = result.redirect;
      }, 100);
      return { message: "Redirecting to dashboard..." };
    }
    
    return result;
  };

  const handleSignUp = async (prevState: any, formData: FormData) => {
    // Store email for success state
    const email = formData.get("email") as string;
    setRegistrationEmail(email);

    if (returnUrl) {
      formData.append("returnUrl", returnUrl);
    }
    
    // Add origin for email redirects
    formData.append("origin", window.location.origin);
    
    const result = await signUp(prevState, formData);
    
    // Handle success with redirect
    if (result && result.success && result.redirect) {
      // Add a small delay to ensure session is properly saved
      setTimeout(() => {
        window.location.href = result.redirect;
      }, 100);
      return { message: "Redirecting to dashboard..." };
    }
    
    // Check if registration was successful but needs email verification
    if (result && typeof result === 'object' && 'message' in result) {
      const resultMessage = result.message as string;
      if (resultMessage.includes("Check your email")) {
        setRegistrationSuccess(true);
        
        // Update URL without causing a refresh
        const params = new URLSearchParams(window.location.search);
        params.set('message', resultMessage);
        
        const newUrl = 
          window.location.pathname + 
          (params.toString() ? '?' + params.toString() : '');
          
        window.history.pushState({ path: newUrl }, '', newUrl);
        
        return result;
      }
    }
    
    return result;
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setForgotPasswordStatus({});
    
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setForgotPasswordStatus({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("email", forgotPasswordEmail);
    formData.append("origin", window.location.origin);
    
    const result = await forgotPassword(null, formData);
    
    setForgotPasswordStatus(result);
  };

  const resetRegistrationSuccess = () => {
    setRegistrationSuccess(false);
    
    // Remove message from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('message');
    
    const newUrl = 
      window.location.pathname + 
      (params.toString() ? '?' + params.toString() : '');
      
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    router.refresh();
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Animated Dots Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute w-full h-full">
          <FlickeringGrid
            squareSize={2.2}
            gridGap={20}
            color="var(--primary)"
            maxOpacity={0.2}
            flickerChance={0.04}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 py-12 md:py-24">
        <div className="w-full max-w-lg mx-auto">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tighter mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground text-balance">
              {isSignUp ? 'Sign up to get started with your AI agent' : 'Sign in to continue with your AI agent'}
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-8">
            {/* Registration Success Screen */}
            {registrationSuccess ? (
              <div className="flex flex-col items-center text-center p-6 space-y-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MailCheck className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-medium">Check your email</h2>
                <p className="text-muted-foreground">
                  We've sent a verification link to <strong>{registrationEmail}</strong>.
                  <br />
                  Please check your inbox and click the link to activate your account.
                </p>
                <button 
                  onClick={resetRegistrationSuccess}
                  className="text-primary hover:text-primary/80 underline"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <div>
                {/* Social Login Options */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="w-full flex justify-center">
                    <GoogleSignIn returnUrl={returnUrl || undefined} />
                  </div>
                </div>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
                  </div>
                </div>
                
                {/* Login/Signup Form */}
                <form className="space-y-4">
                  {/* Display Error Messages */}
                  {message && !isSuccessMessage && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3 mb-4">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{message}</span>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email address"
                      required
                      className="h-12 rounded-full bg-background border-border"
                    />
                    
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password"
                      required
                      className="h-12 rounded-full bg-background border-border"
                    />
                    
                    {isSignUp && (
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        required
                        className="h-12 rounded-full bg-background border-border"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    {!isSignUp ? (
                      <>
                        <SubmitButton
                          formAction={handleSignIn}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                          pendingText="Signing in..."
                        >
                          Sign in
                        </SubmitButton>
                        
                        <Link
                          href={`/auth?mode=signup${returnUrl ? `&returnUrl=${returnUrl}` : ''}`}
                          className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
                        >
                          Create new account
                        </Link>
                      </>
                    ) : (
                      <>
                        <SubmitButton
                          formAction={handleSignUp}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                          pendingText="Creating account..."
                        >
                          Sign up
                        </SubmitButton>
                        
                        <Link
                          href={`/auth${returnUrl ? `?returnUrl=${returnUrl}` : ''}`}
                          className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
                        >
                          Back to sign in
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {!isSignUp && (
                    <div className="text-center pt-2">
                      <button 
                        type="button"
                        onClick={() => setForgotPasswordOpen(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </form>

                <div className="mt-8 text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}<Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-xl bg-card border border-border backdrop-blur-sm">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-medium">Reset Password</DialogTitle>
              <button 
                onClick={() => setForgotPasswordOpen(false)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <DialogDescription className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
            <Input
              id="forgot-password-email"
              type="email"
              placeholder="Email address"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="h-12 rounded-full bg-background border-border"
              required
            />
            
            {forgotPasswordStatus.message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                forgotPasswordStatus.success 
                  ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-400" 
                  : "bg-secondary/10 border border-secondary/20 text-secondary"
              }`}>
                {forgotPasswordStatus.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
                )}
                <span className="text-sm font-medium">{forgotPasswordStatus.message}</span>
              </div>
            )}
            
            <DialogFooter className="flex sm:justify-start gap-3 pt-2">
              <button
                type="submit"
                className="h-12 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="h-12 px-6 rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
              >
                Cancel
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}