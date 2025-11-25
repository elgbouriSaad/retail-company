import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Scissors, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { supabase, checkSupabaseHealth } from '../../lib/supabase';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSupabaseHealthy, setIsSupabaseHealthy] = useState(true);
  const { session } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  // Check Supabase health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkSupabaseHealth();
      setIsSupabaseHealthy(isHealthy);
      if (!isHealthy) {
        setError('Service temporarily unavailable. Please try again later.');
      }
    };
    checkHealth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain both letters and numbers');
      return;
    }

    setIsLoading(true);

    try {
      // Check database health before attempting registration
      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy) {
        setError('Service temporarily unavailable. Please check your connection and try again later.');
        setIsSupabaseHealthy(false);
        setIsLoading(false);
        return;
      }

      setIsSupabaseHealthy(true);
      
      // Register directly with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        // Handle specific errors
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setError('This email is already registered. Please try logging in instead.');
        } else if (error.message.includes('Password') && error.message.includes('weak')) {
          setError('Password is too weak. Use at least 8 characters with letters and numbers.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.session) {
        // User auto-confirmed and logged in
        console.log('✅ Registration successful');
        // onAuthStateChange will handle state update and redirect
      } else if (data.user) {
        // Email confirmation required
        setError('Registration successful! Please check your email to confirm your account.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Scissors className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join SewCraft</h1>
          <p className="text-slate-400">Create your account</p>
        </div>

        <Card>
          {!isSupabaseHealthy && (
            <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-200 font-medium">Service Status Warning</p>
                <p className="text-yellow-300/80 text-sm mt-1">
                  Connection issues detected. Registration may be temporarily unavailable. Please try again later.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              value={name}
              onChange={setName}
              placeholder="Enter your full name"
              required
            />

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
                placeholder="Create a password"
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

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm your password"
              required
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !isSupabaseHealthy}
              className="w-full"
            >
              {isLoading ? 'Creating account...' : isSupabaseHealthy ? 'Create Account' : 'Service Unavailable'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};