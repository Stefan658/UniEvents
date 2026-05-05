import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginOrganizer, loginAdmin, loginStudent } from '../api/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import SectionCard from '../components/SectionCard';
import ErrorMessage from '../components/ErrorMessage';
import { Shield, GraduationCap, Lock, Mail, Sparkles } from 'lucide-react';
import logo from '../assets/unievents-logo.png';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-3 shrink-0">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c1.82-1.67 2.87-4.14 2.87-7.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (activeTab === 'organizer') {
        response = await loginOrganizer(email, password);
      } else if (activeTab === 'admin') {
        response = await loginAdmin(email, password);
      } else {
        // Participant login
        response = await loginStudent({ email, first_name: "Participant", last_name: "USV" });
      }

      login(response.user, response.token);
      
      // Role-based redirection logic
      const userRole = response.user?.role?.name || response.user?.role;
      let targetPath = from;
      
      if (from === '/') {
        if (userRole === 'organizer') targetPath = '/organizer';
        else if (userRole === 'admin') targetPath = '/admin';
      }
      
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-block group">
          <img 
            src={logo} 
            alt="UniEvents Logo" 
            className="mx-auto w-80 h-auto rounded-[8.5rem] shadow-2xl group-hover:scale-105 transition-transform duration-300 border-[12px] border-white/50"
          />
        </Link>
        <h2 className="mt-12 text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm font-normal text-gray-500">
          Sign in to manage your university experience
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-soft-lg border border-gray-100/50 sm:rounded-[2.5rem] sm:px-10">
          <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'student' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 mr-2" />
              Participant
            </button>
            <button
              onClick={() => setActiveTab('organizer')}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'organizer' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5 mr-2" />
              Staff
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'admin' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5 mr-2" />
              Admin
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && <ErrorMessage message={error} />}

            <div className="space-y-4">
              <InputField
                label={activeTab === 'student' ? "University Email" : "Email Address"}
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'student' ? "" : "email@uni.events"}
                required
              />

              {activeTab !== 'student' && (
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              )}
            </div>

            {activeTab === 'student' && (
              <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-primary-600 shrink-0" />
                <p className="text-xs font-semibold text-primary-700 leading-relaxed">
                  Students and Professors use Google Sign-In with their @student.usv.ro or @profesor.usv.ro account
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full !py-4 bg-white hover:bg-primary-600 hover:text-white text-primary-700 border border-primary-500 shadow-sm flex items-center justify-center transition-all duration-200 group"
              isLoading={loading}
            >
              {activeTab === 'student' ? (
                <div className="flex items-center justify-center gap-3">
                  <GoogleIcon />
                  <span className="font-semibold text-primary-700 group-hover:text-white transition-colors duration-200">
                    Continue with Google
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-primary-700 group-hover:text-white transition-colors duration-200">
                  Sign In
                </span>
              )}
          </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-xs font-medium text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
