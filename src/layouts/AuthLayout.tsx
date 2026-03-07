import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { Layers, Zap, BarChart3 } from 'lucide-react'; // Intelligent/SaaS icons

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">

      <div className="relative flex min-h-screen">
        {/* Left Panel - Bitewise Branding (Hidden on mobile) */}
        <motion.div
          className="relative hidden w-[45%] lg:flex flex-col justify-between overflow-hidden bg-[#0f1729] text-white p-12"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background Gradient & Effects */}
          <div className="absolute inset-0 z-0">
            {/* Deep Navy to Charcoal Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f1729] via-[#1e293b] to-[#0f1729]" />

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

            {/* Soft Radial Highlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-indigo-500/10 blur-[100px] rounded-full" />
          </div>

          {/* Logo */}
          <motion.div
            className="relative z-10 flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 box-border border border-indigo-500/30 backdrop-blur-sm">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white/90">Bitewise</span>
          </motion.div>

          {/* Hero Content */}
          <div className="relative z-10 space-y-8 max-w-lg">
            <motion.h1
              className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Intelligent hospitality operations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">simplified.</span>
            </motion.h1>

            <motion.p
              className="text-lg text-slate-400 dark:text-slate-400 font-light leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Data-driven insights, seamless inventory management, and workforce optimization—all in one refined dashboard.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {['Real-time Analytics', 'Smart Inventory', 'Team Sync'].map((feature, i) => (
                <div key={feature} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 backdrop-blur-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {feature}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer Quote */}
          <motion.div
            className="relative z-10 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <div className="flex items-center gap-4">
              {/* Just a subtle footer element */}
              <p className="text-sm text-slate-500">© 2024 Bitewise Inc. Enterprise Grade Security.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Auth Form */}
        <div className="relative flex w-full flex-col lg:w-[55%] bg-background">
          {/* Mobile Header */}
          <motion.div
            className="flex items-center justify-between p-6 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Bitewise</span>
            </div>
            <ThemeToggle />
          </motion.div>

          {/* Desktop Theme Toggle (Optional, can be removed if strictly dark mode) */}
          <div className="absolute right-6 top-6 hidden lg:block z-20">
            <ThemeToggle />
          </div>

          {/* Form Container */}
          <div className="flex flex-1 items-center justify-center p-6 lg:p-24">
            <motion.div
              className="w-full max-w-md space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Header Text */}
              <div className="text-center space-y-2">
                <motion.h2
                  className="text-3xl font-bold tracking-tight text-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {title}
                </motion.h2>
                {subtitle && (
                  <motion.p
                    className="text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>

              {/* The actual Card Content (Children) */}
              <div className="auth-card">
                {children}
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
