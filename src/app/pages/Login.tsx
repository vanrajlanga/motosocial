import { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { signIn, signUp } from '../utils/authService';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);

  // Auto-create admin user on first load if needed
  useEffect(() => {
    const setupAdmin = async () => {
      const adminSetup = localStorage.getItem('motopsy_admin_setup_complete');
      
      if (!adminSetup) {
        console.log('🔧 First-time setup: Creating admin account...');
        try {
          const result = await signUp('admin@eclipso.com', '123456', 'Admin');
          if (result.success) {
            console.log('✅ Admin account created successfully!');
            localStorage.setItem('motopsy_admin_setup_complete', 'true');
            setSetupComplete(true);
          } else {
            // User might already exist, that's fine
            console.log('ℹ️ Admin setup note:', result.error);
            localStorage.setItem('motopsy_admin_setup_complete', 'true');
          }
        } catch (error) {
          console.log('ℹ️ Admin setup error (may already exist):', error);
          localStorage.setItem('motopsy_admin_setup_complete', 'true');
        }
      }
    };

    setupAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        // Success! Redirect to dashboard
        onLoginSuccess();
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Motopsy AI</h1>
          <p className="text-blue-100">Social Media Marketing Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome Back</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eclipso.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-700 font-mono">Email: admin@eclipso.com</p>
            <p className="text-xs text-blue-700 font-mono">Password: 123456</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          © 2024 Motopsy AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}