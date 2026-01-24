import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle, Send } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSuccess(true);
      toast.success("Password reset link sent");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message ? err.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(').', '').replace(/-/g, ' ') : "An error occurred";
      setError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSuccess ? "Check your email" : "Reset your password"}
      subtitle={isSuccess
        ? `We've sent a password reset link to ${email}`
        : "Enter your email and we'll send you a reset link"
      }
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Success Animation */}
            <div className="flex justify-center py-6">
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2
                }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-success/20"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Icon container */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.4,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <CheckCircle className="h-12 w-12 text-success" strokeWidth={1.5} />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Instructions */}
            <motion.div
              className="space-y-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-sm text-muted-foreground">
                Click the link in your email to reset your password.
                If you don't see the email, check your spam folder.
              </p>

              {/* Resend Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resetPassword(email);
                    toast.success("Email sent again");
                  } catch (e) {
                    toast.error("Failed to resend");
                  }
                }}
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                <Send className="h-4 w-4" />
                Resend email
              </button>
            </motion.div>

            {/* Back to Login */}
            <Link to="/login">
              <AuthButton variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </AuthButton>
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <AuthInput
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-5 w-5" />}
              autoComplete="email"
              autoFocus
              required
            />

            {/* Submit Button */}
            <AuthButton
              type="submit"
              isLoading={isLoading}
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Send reset link
            </AuthButton>

            {/* Back to Login */}
            <Link to="/login">
              <AuthButton variant="ghost" type="button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </AuthButton>
            </Link>

            {/* Help Text */}
            <motion.p
              className="text-center text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Need help?{' '}
              <a href="#" className="auth-link">
                Contact support
              </a>
            </motion.p>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
