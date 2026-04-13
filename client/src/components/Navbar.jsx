import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Layout, Award, Settings, Menu, X, ShieldCheck, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
               <ShieldCheck size={24} />
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">
               SECURE<span className="text-indigo-600">DRIVE</span>
             </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to={user.role === 'admin' ? '/admin' : '/student'} className="text-sm font-black uppercase text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
              <Layout size={16} /> Dashboard
            </Link>
            {user.role === 'student' ? (
              <Link to="/student/results" className="text-sm font-black uppercase text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
                <Award size={16} /> My Results
              </Link>
            ) : (
              <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full tracking-widest border border-indigo-100">
                ADMIN PRIVILEGES
              </span>
            )}
          </div>

          {/* User Profile / Logout */}
          <div className="hidden md:flex items-center gap-5 pl-8 border-l border-slate-100">
             <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 leading-none mb-1">{user.name}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
             </div>
             <button onClick={handleLogout} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center border border-slate-100">
                <LogOut size={18} />
             </button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 p-2">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-50 animate-fade-in p-6 space-y-4 shadow-xl">
           <Link onClick={() => setIsOpen(false)} to={user.role === 'admin' ? '/admin' : '/student'} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl font-bold text-slate-900">
             <Layout size={20} /> Dashboard
           </Link>
           {user.role === 'student' && (
             <Link onClick={() => setIsOpen(false)} to="/student/results" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl font-bold text-slate-900">
               <Award size={20} /> My Results
             </Link>
           )}
           <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">{user.name?.charAt(0)}</div>
                 <span className="font-bold text-slate-900">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="text-red-500 font-bold uppercase text-xs">Sign Out</button>
           </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
