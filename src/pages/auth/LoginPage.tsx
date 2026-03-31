import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton, GoogleButton, GithubButton } from '@/components/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { doc, getDoc, collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
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
  const { tableId } = useParams();

  // Role redirection is now natively handled by the global AuthContext and App.tsx RedirectHandler

  useEffect(() => {
    if (tableId) {
      sessionStorage.setItem('currentTable', tableId);
      toast.info(`Welcome! You are at Table ${tableId}`);
    }
  }, [tableId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Let App.tsx RedirectHandler take over automatically when AuthContext resolves!
      toast.success("Login successful");

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
      await loginWithGoogle();
      toast.success("Login successful");

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
      await loginWithGithub();
      toast.success("Login successful");

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
      title="Welcome back to Bitewise"
      subtitle="Smart operations for modern food businesses."
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
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AuthInput
            label="Email address"
            type="email"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5" />}
            autoComplete="email"
            required
          />
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AuthInput
            label="Password"
            type="password"
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="current-password"
            required
          />
        </motion.div>

        {/* Forgot Password Link */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/forgot-password"
            className="auth-link text-sm"
          >
            Forgot password?
          </Link>
        </motion.div>

        {/* Login Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AuthButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={<ArrowRight className="h-5 w-5" />}
          >
            Sign in
          </AuthButton>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="auth-divider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span>or continue with</span>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Google OAuth */}
          <GoogleButton
            isLoading={isGoogleLoading}
            onClick={handleGoogleLogin}
          />
        </motion.div>

        {/* Sign Up Link */}
        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
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
