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
    <div className="flex-1 p-5 md:p-12 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <header className="mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Ready for the test, <span className="text-indigo-600 uppercase">{user?.name?.split(' ')[0]}?</span>
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-base md:text-lg max-w-2xl leading-relaxed">
              Your academic journey continues here. Take active assessments and receive real-time feedback.
            </p>
          </header>

          <div className="flex items-center gap-2 mb-8">
            <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Current Open Assessments <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px]">{exams.length}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in delay-100">
            {exams.map(exam => (
              <div key={exam._id} className="group bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col items-start text-left relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors"></div>
                
                <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                   <Clock size={28} />
                </div>

                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">{exam.title}</h3>
                <p className="text-sm md:text-base text-slate-500 font-medium mb-8 flex-1 line-clamp-3 leading-relaxed">
                  {exam.description || "Comprehensive test covering core concepts. Please read all instructions before proceeding."}
                </p>

                <div className="w-full flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Time Limit</span>
                    <span className="text-lg font-black text-slate-700">{exam.durationMinutes}m</span>
                  </div>
                  
                  {(() => {
                    const now = new Date();
                    const availableFrom = exam.availableFrom ? new Date(exam.availableFrom) : null;
                    const availableUntil = exam.availableUntil ? new Date(exam.availableUntil) : null;
                    
                    if (availableFrom && now < availableFrom) {
                      return (
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Locked</span>
                           <span className="text-[10px] text-slate-400 font-bold leading-none">{availableFrom.toLocaleString()}</span>
                        </div>
                      );
                    }
                    if (availableUntil && now > availableUntil) {
                      return (
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Closed</span>
                           <span className="text-[10px] text-slate-400 font-bold leading-none">{availableUntil.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return (
                      <button 
                        onClick={() => navigate(`/student/exam/${exam._id}`)}
                        className="h-14 px-8 bg-slate-900 group-hover:bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/10"
                      >
                        ENTER ROOM <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
            
            {exams.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 shadow-inner">
                <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                  <PlayCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Clear Schedule!</h3>
                <p className="text-slate-500 font-medium max-w-sm text-center">There are no assessments waiting for you. Get some rest and check back later.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
