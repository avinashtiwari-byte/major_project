import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Shield } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', adminCode: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(formData.name, formData.email, formData.password, formData.role, formData.adminCode);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10] p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] -ml-80 -mb-80"></div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-indigo-600 mb-6 shadow-2xl shadow-indigo-600/20 transform -rotate-6">
             <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">PROTOCOL <span className="text-indigo-500">INITIATION</span></h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Accessing Central Examination Terminal</p>
        </div>
        
        <div className="bg-[#151921] border border-white/5 rounded-[40px] p-10 shadow-3xl backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 text-xs font-bold flex items-center gap-3 animate-slide-in">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Candidate Nominal</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-6 h-14 bg-[#0a0c10] border-2 border-slate-800/50 rounded-2xl text-white font-bold focus:border-indigo-600 outline-none transition-all placeholder:text-slate-800"
                  placeholder="e.g. AVINASH TIWARI"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Digital Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-6 h-14 bg-[#0a0c10] border-2 border-slate-800/50 rounded-2xl text-white font-bold focus:border-indigo-600 outline-none transition-all placeholder:text-slate-800"
                  placeholder="candidate@terminal.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Keyphrase</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-6 h-14 bg-[#0a0c10] border-2 border-slate-800/50 rounded-2xl text-white font-bold focus:border-indigo-600 outline-none transition-all placeholder:text-slate-800"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clearance Level</label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                <select
                  className="w-full pl-12 pr-6 h-14 bg-[#0a0c10] border-2 border-slate-800/50 rounded-2xl text-white font-bold focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="student">Level 1: Candidate</option>
                  <option value="admin">Level 2: Administrator</option>
                </select>
              </div>
            </div>

            {formData.role === 'admin' && (
              <div className="space-y-2 animate-slide-in">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin Authorization Token</label>
                <input
                  type="password"
                  required
                  className="w-full px-6 h-14 bg-indigo-500/5 border-2 border-indigo-500/20 rounded-2xl text-indigo-500 font-black focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-900/30"
                  placeholder="Enter secret protocol code"
                  value={formData.adminCode}
                  onChange={(e) => setFormData({...formData, adminCode: e.target.value})}
                />
              </div>
            )}
            
            <button type="submit" className="w-full h-16 bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-600/20 transition-all duration-300 transform active:scale-[0.98] uppercase tracking-[0.2em] text-sm group">
               Deploy Account <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </form>

          <p className="mt-10 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
            Existing Identity? <Link to="/login" className="text-white hover:text-indigo-400 border-b border-indigo-600/50 transition-all ml-1">Re-authenticate here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
