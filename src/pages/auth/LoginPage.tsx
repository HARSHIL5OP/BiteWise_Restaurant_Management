import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton, GoogleButton } from '@/components/auth/AuthButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Simulated login handler (UI only - logic exists elsewhere)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Your existing Firebase auth logic would go here
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsGoogleLoading(false);
      // Your existing Google OAuth logic would go here
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleLogin} className="space-y-5">
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
          required
        />

        {/* Password Input */}
        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="h-5 w-5" />}
          autoComplete="current-password"
          required
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="auth-link text-sm"
          >
            Forgot password?
          </Link>
        </div>

        {/* Login Button */}
        <AuthButton
          type="submit"
          isLoading={isLoading}
          icon={<ArrowRight className="h-5 w-5" />}
        >
          Sign in
        </AuthButton>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google OAuth */}
        <GoogleButton 
          isLoading={isGoogleLoading}
          onClick={handleGoogleLogin}
        />

        {/* Sign Up Link */}
        <motion.p 
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">
            Create one now
          </Link>
        </motion.p>
      </form>
    </AuthLayout>
  );
}
