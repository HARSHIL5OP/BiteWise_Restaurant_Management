import { useState, forwardRef, InputHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, success, icon, type = 'text', className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === 'password';

    // We can use the 'group' class or local simple state/css for floating labels
    // The CSS logic for floating label is in index.css relying on :placeholder-shown

    return (
      <div className="space-y-1">
        <div className="relative group input-group">
          {/* Icon */}
          {icon && (
            <div className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused || props.value ? 'text-amber-500' : 'text-slate-400'}`}>
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'auth-input',
              icon && 'pl-11', // Adjust padding for icon
              isPassword && 'pr-12',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              success && 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            placeholder=" " // Required for :placeholder-shown CSS trick
            {...props}
          />

          {/* Floating Label */}
          <label
            className={cn(
              "input-label pointer-events-none absolute left-4 transition-all duration-200 ease-out origin-[0]",
              icon ? "left-11" : "left-4",
              // Initial state (centered) handled by index.css, mostly
            )}
          >
            {label}
          </label>


          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
              tabIndex={-1}
            >
              <AnimatePresence mode="wait" initial={false}>
                {showPassword ? (
                  <motion.div
                    key="hide"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <EyeOff className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="show"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Eye className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}

        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-center gap-2 text-sm text-red-400 pl-1"
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
