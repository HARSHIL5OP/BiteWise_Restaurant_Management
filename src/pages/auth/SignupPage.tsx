import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton, GoogleButton } from '@/components/auth/AuthButton';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Your existing Firebase auth logic would go here
    }, 1500);
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      setIsGoogleLoading(false);
      // Your existing Google OAuth logic would go here
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Create your account"
      subtitle="Start your 14-day free trial"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            label="First name"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
            required
          />
          <AuthInput
            label="Last name"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
            required
          />
        </div>

        {/* Email Input */}
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          icon={<Mail className="h-5 w-5" />}
          autoComplete="email"
          required
        />

        {/* Password Input */}
        <div className="space-y-3">
          <AuthInput
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={errors.password}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="new-password"
            required
          />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        {/* Confirm Password */}
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          success={formData.confirmPassword && formData.password === formData.confirmPassword}
          icon={<Lock className="h-5 w-5" />}
          autoComplete="new-password"
          required
        />

        {/* Terms Checkbox */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => updateField('acceptTerms', e.target.checked)}
                className="peer sr-only"
              />
              <motion.div
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                  formData.acceptTerms 
                    ? 'border-accent bg-accent' 
                    : 'border-border bg-background'
                } ${errors.acceptTerms ? 'border-destructive' : ''}`}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence>
                  {formData.acceptTerms && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-accent-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <a href="#" className="auth-link">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="auth-link">Privacy Policy</a>
            </span>
          </label>
          {errors.acceptTerms && (
            <motion.p 
              className="text-xs text-destructive"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.acceptTerms}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          isLoading={isLoading}
          icon={<ArrowRight className="h-5 w-5" />}
        >
          Create account
        </AuthButton>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Google OAuth */}
        <GoogleButton 
          isLoading={isGoogleLoading}
          onClick={handleGoogleSignup}
        />

        {/* Sign In Link */}
        <motion.p 
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </motion.p>

        {/* Security Note */}
        <motion.div 
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Shield className="h-4 w-4" />
          <span>Your data is encrypted and secure</span>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
