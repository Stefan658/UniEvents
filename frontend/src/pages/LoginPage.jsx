import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginOrganizer, loginAdmin, loginStudent } from '../api/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import SectionCard from '../components/SectionCard';
import ErrorMessage from '../components/ErrorMessage';
import { Calendar, Shield, GraduationCap, Lock, Mail, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="bg-primary-600 p-2.5 rounded-2xl group-hover:rotate-6 transition-transform duration-300 shadow-primary-200 shadow-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-primary-900">
            UniEvents
          </span>
        </Link>
        <h2 className="mt-6 text-3xl font-black text-gray-900 tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Sign in to manage your university experience
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-soft-lg border border-gray-100/50 sm:rounded-[2.5rem] sm:px-10">
          <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'student' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 mr-2" />
              Participant
            </button>
            <button
              onClick={() => setActiveTab('organizer')}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'organizer' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5 mr-2" />
              Staff
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
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
                placeholder={activeTab === 'student' ? "user@student.usv.ro or user@profesor.usv.ro" : "email@uni.events"}
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
                <p className="text-xs font-bold text-primary-700 leading-relaxed">
                  Students and Professors use Google Sign-In with their @student.usv.ro or @profesor.usv.ro account. (Demo: enter your email to proceed)
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full !py-4 shadow-primary-200 shadow-xl"
              isLoading={loading}
            >
              {activeTab === 'student' ? 'Continue with Google' : 'Sign In'}
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
