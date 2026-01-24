import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton, GoogleButton, GithubButton } from '@/components/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cred = await login(email, password);
      // Fetch role manually for instant redirect
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      const userData = userDoc.data();
      const role = userData?.role || 'customer';

      toast.success("Login successful");
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'chef') {
        navigate('/Chef');
      } else if (role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = "An error occurred";

      if (err.code === 'auth/internal-error' || err.message?.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message) {
        errorMessage = err.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(').', '').replace(/-/g, ' ');
      }

      setError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      // Fetch role manually for instant redirect (loginWithGoogle in context handles creation but returns result)
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      const userData = userDoc.data();
      const role = userData?.role || 'customer';

      toast.success("Login successful");
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'chef') {
        navigate('/Chef');
      } else if (role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message ? err.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(').', '').replace(/-/g, ' ') : "An error occurred";
      setError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    setError('');
    try {
      const result = await loginWithGithub();
      // Fetch role manually for instant redirect
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      const userData = userDoc.data();
      const role = userData?.role || 'customer';

      toast.success("Login successful");
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'chef') {
        navigate('/Chef');
      } else if (role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message ? err.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(').', '').replace(/-/g, ' ') : "An error occurred";
      setError(errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
    } finally {
      setIsGithubLoading(false);
    }
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

        <div className="space-y-3">
          {/* Google OAuth */}
          <GoogleButton
            isLoading={isGoogleLoading}
            onClick={handleGoogleLogin}
          />

          {/* GitHub OAuth */}
          <GithubButton
            isLoading={isGithubLoading}
            onClick={handleGithubLogin}
          />
        </div>

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
