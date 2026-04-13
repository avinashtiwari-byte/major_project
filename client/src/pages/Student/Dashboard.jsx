import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { LogOut, BookOpen, Clock, PlayCircle, Award, Layout, Menu, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await axios.get('/exams');
      setExams(data);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex-1 p-6 md:p-12 bg-[#fdfdff]">
      <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <header className="mb-16 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
               <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate Terminal Activated</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
              Welcome back, <span className="text-indigo-600 uppercase italic">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-500 font-medium text-base md:text-xl max-w-2xl leading-relaxed">
              Access your secure assessment protocols and track your academic progress in real-time.
            </p>
          </header>

          <div className="flex items-center justify-between mb-10 animate-fade-in [animation-delay:200ms]">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                Available Assessments
              </h2>
            </div>
            <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{exams.length} PROTOCOLS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in [animation-delay:400ms]">
            {exams.map(exam => (
              <div key={exam._id} className="card p-10 border-0 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col group relative bg-white">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <BookOpen size={100} />
                </div>
                
                <div className="h-14 w-14 bg-slate-50 text-indigo-600 rounded-[24px] flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                   <Clock size={24} />
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter group-hover:text-indigo-600 transition-colors leading-tight">{exam.title}</h3>
                <p className="text-sm text-slate-500 font-semibold mb-10 flex-1 line-clamp-3 leading-relaxed italic">
                  {exam.description || "Authorized assessment brief. Prepare your environment before initiation."}
                </p>

                <div className="w-full flex items-center justify-between mt-auto pt-8 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Time Limit</span>
                    <span className="text-xl font-black text-slate-900 tracking-tighter">{exam.durationMinutes}m</span>
                  </div>
                  
                  {(() => {
                    const now = new Date();
                    const availableFrom = exam.availableFrom ? new Date(exam.availableFrom) : null;
                    const availableUntil = exam.availableUntil ? new Date(exam.availableUntil) : null;
                    
                    if (availableFrom && now < availableFrom) {
                      return (
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Locked</span>
                           <span className="text-[10px] text-slate-400 font-black leading-none">{availableFrom.toLocaleDateString()}</span>
                        </div>
                      );
                    }
                    if (availableUntil && now > availableUntil) {
                      return (
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Expired</span>
                           <span className="text-[10px] text-slate-400 font-black leading-none">{availableUntil.toLocaleDateString()}</span>
                        </div>
                      );
                    }
                    return (
                      <button 
                        onClick={() => navigate(`/student/exam/${exam._id}`)}
                        className="h-14 px-8 bg-slate-900 group-hover:bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10 group-hover:shadow-indigo-600/20"
                      >
                        INITIATE <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
            
            {exams.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border-4 border-dashed border-slate-100 animate-pulse-slow shadow-inner">
                <div className="h-20 w-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                  <PlayCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Null Assessment Load</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center px-8 leading-relaxed">System is currently clear of pending exam protocols.</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default StudentDashboard;
