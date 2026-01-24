import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const passedRules = passwordRules.filter((rule) => rule.test(password)).length;
  const strength = password ? (passedRules / passwordRules.length) * 100 : 0;

  const getStrengthColor = () => {
    if (strength <= 20) return 'bg-destructive';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-lime-500';
    return 'bg-success';
  };

  const getStrengthLabel = () => {
    if (!password) return '';
    if (strength <= 20) return 'Very weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <motion.span
            key={getStrengthLabel()}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'font-medium',
              strength <= 40 ? 'text-destructive' : strength <= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-success'
            )}
          >
            {getStrengthLabel()}
          </motion.span>
        </div>
        <div className="strength-meter">
          <motion.div
            className={cn('strength-meter-fill', getStrengthColor())}
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Password Rules */}
      <div className="space-y-1.5">
        {passwordRules.map((rule, index) => {
          const passed = rule.test(password);
          return (
            <motion.div
              key={rule.label}
              className="flex items-center gap-2 text-xs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full transition-colors',
                  passed ? 'bg-success text-success-foreground' : 'bg-muted'
                )}
                animate={{ scale: passed ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.2 }}
              >
                {passed && (
                  <motion.svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                )}
              </motion.div>
              <span className={passed ? 'text-foreground' : 'text-muted-foreground'}>
                {rule.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
