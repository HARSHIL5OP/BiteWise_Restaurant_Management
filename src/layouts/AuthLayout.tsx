import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { Coffee } from 'lucide-react';
import authHero from '@/assets/auth-hero.jpg';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden theme-transition">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-cream" />
      
      <div className="relative flex min-h-screen">
        {/* Left Panel - Branding (Hidden on mobile) */}
        <motion.div 
          className="relative hidden w-1/2 overflow-hidden lg:block"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Hero Image */}
          <div className="absolute inset-0">
            <img 
              src={authHero} 
              alt="Modern cafe interior" 
              className="h-full w-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent dark:from-primary/90 dark:via-primary/70" />
          </div>

          {/* Animated blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="blob blob-1 absolute -left-20 top-20 h-72 w-72"
              animate={{ 
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="blob blob-2 absolute -bottom-20 left-1/3 h-96 w-96"
              animate={{ 
                x: [0, -20, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="blob blob-3 absolute right-10 top-1/3 h-80 w-80"
              animate={{ 
                x: [0, 20, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Content */}
          <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/90 shadow-glow">
                <Coffee className="h-6 w-6 text-accent-foreground" />
              </div>
              <span className="text-2xl font-bold">CaféPOS</span>
            </motion.div>

            {/* Marketing Content */}
            <motion.div 
              className="max-w-lg space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
                Run your café{' '}
                <span className="relative">
                  smarter
                  <motion.div 
                    className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  />
                </span>
                ,{' '}
                <span className="text-accent">faster</span>,{' '}
                better.
              </h1>
              <p className="text-lg text-primary-foreground/80">
                Where orders, payments, and people connect. The all-in-one POS system designed for modern restaurants and cafés.
              </p>
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="flex items-center gap-2 text-sm text-primary-foreground/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <span>Trusted by 2,000+ cafés worldwide</span>
              <span className="mx-2">•</span>
              <span>Enterprise-grade security</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Auth Form */}
        <div className="relative flex w-full flex-col lg:w-1/2">
          {/* Mobile Header */}
          <motion.div 
            className="flex items-center justify-between p-6 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Coffee className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CaféPOS</span>
            </div>
            <ThemeToggle />
          </motion.div>

          {/* Desktop Theme Toggle */}
          <motion.div 
            className="absolute right-6 top-6 hidden lg:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ThemeToggle />
          </motion.div>

          {/* Form Container */}
          <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
            <motion.div 
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Card */}
              <div className="auth-card">
                {/* Header */}
                <div className="mb-8 text-center">
                  <motion.h2 
                    className="text-2xl font-bold text-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {title}
                  </motion.h2>
                  {subtitle && (
                    <motion.p 
                      className="mt-2 text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {subtitle}
                    </motion.p>
                  )}
                </div>

                {/* Form Content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {children}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
