import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Scissors, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'user' | 'admin') => {
    const demoCredentials = role === 'admin' 
      ? { email: 'admin@demo.com', password: 'demo' }
      : { email: 'user@demo.com', password: 'demo' };
    
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Scissors className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SewCraft</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="Enter your email"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400 text-sm text-center mb-4">Demo Accounts:</p>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('user')}
                className="w-full"
              >
                Login as User
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('admin')}
                className="w-full"
              >
                Login as Admin
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300">
                Sign up
              </Link>
            </p>
            <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
              Forgot your password?
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};