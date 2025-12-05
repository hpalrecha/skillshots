
import React, { useState } from 'react';
import { User } from '../types';
import { SkillShotsLogo, LoaderIcon, ArrowLeftIcon } from './icons';

interface LoginProps {
  onLogin: (userId: string) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
          // Check password (simple direct comparison for this mock)
          // In a real app, this happens on the backend with hashes
          if (user.password && user.password === password) {
              onLogin(user.id);
          } else if (!user.password && password === 'password123') {
              // Legacy/Default fallback if no password set yet
              onLogin(user.id);
          } else {
             throw new Error('Invalid password.');
          }
      } else {
          throw new Error('User not found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess('');
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = users.find(u => u.email.toLowerCase() === forgotEmail.toLowerCase());
    
    setIsLoading(false);

    if (user) {
        setForgotSuccess(`A password reset link has been sent to ${forgotEmail}. Please check your inbox.`);
        console.log(`[Mock Email Service] To: ${forgotEmail} | Subject: Password Reset Request | Body: Click here to reset your password.`);
    } else {
        setError('We could not find an account with that email address.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="flex flex-col justify-center items-center mb-8">
            <SkillShotsLogo className="h-16 w-16 text-primary mb-3" />
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">SkillShots</h1>
            <p className="text-gray-500 mt-2 font-medium">Quick Learning for Growth</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            {isForgotPassword ? (
                <>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Reset Password</h2>
                    <p className="text-center text-gray-500 mb-6 text-sm">Enter your email and we'll send you instructions.</p>
                    
                    {forgotSuccess ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 text-center text-sm">
                            {forgotSuccess}
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div>
                                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                                Email Address
                                </label>
                                <div className="mt-1">
                                <input
                                    id="forgot-email"
                                    type="email"
                                    required
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="you@example.com"
                                />
                                </div>
                            </div>

                            {error && <p className="text-sm text-center text-error">{error}</p>}

                            <div>
                                <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
                                >
                                {isLoading ? <LoaderIcon className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    )}
                    
                    <button 
                        onClick={() => { setIsForgotPassword(false); setForgotSuccess(''); setError(''); }}
                        className="w-full mt-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1"/> Back to Login
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                        </label>
                        <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                        Password
                        </label>
                        <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                        <button 
                            type="button" 
                            onClick={() => setIsForgotPassword(true)}
                            className="text-sm font-medium text-sky-600 hover:text-sky-500"
                        >
                            Forgot your password?
                        </button>
                    </div>
                    
                    {error && <p className="text-sm text-center text-error">{error}</p>}

                    <div>
                        <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
                        >
                        {isLoading ? <LoaderIcon className="animate-spin h-5 w-5" /> : 'Sign In'}
                        </button>
                    </div>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Default Admin: <code className="bg-gray-200 px-1 rounded text-gray-700">alex@example.com</code></p>
                        <p>Default Learner: <code className="bg-gray-200 px-1 rounded text-gray-700">sam@example.com</code></p>
                        <p>Default Password: <code className="bg-gray-200 px-1 rounded text-gray-700">password123</code></p>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;
