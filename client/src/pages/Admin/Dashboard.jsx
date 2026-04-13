import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { Plus, List, Settings, LogOut, FileText, Users, Clock, MoreVertical, CheckCircle, XCircle, Menu, X, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', description: '', durationMinutes: 60, availableFrom: '', availableUntil: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await axios.get('/exams');
      // Admin sees exams they created or all if we want, but backend returns active exams.
      setExams(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/exams', newExam);
      setShowCreate(false);
      setNewExam({ title: '', description: '', durationMinutes: 60, availableFrom: '', availableUntil: '' });
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExamStatus = async (examId, currentStatus) => {
    try {
      await axios.put(`/exams/${examId}/toggle`);
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 w-full bg-[#fdfdff]">
      <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 animate-fade-in">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                 <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrative Interface V2</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                Assessment <span className="text-indigo-600">Command Center</span>
              </h1>
              <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed">
                Deploy, monitor, and analyze secure examination protocols from a single encrypted terminal.
              </p>
            </div>
            {!showCreate && (
              <button 
                onClick={() => setShowCreate(true)} 
                className="group relative h-14 px-8 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
                <span className="tracking-tight uppercase text-sm">Initiate Assessment</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in [animation-delay:200ms]">
             {[
               { icon: FileText, label: "Total Protocols", value: exams.length, color: "indigo" },
               { icon: Users, label: "Total Candidates", value: exams.reduce((acc, e) => acc + (e.attemptCount || 0), 0), color: "emerald" },
               { icon: Clock, label: "Active Sessions", value: exams.filter(e => e.isActive).length, color: "amber" },
               { icon: Settings, label: "System Health", value: "Optimal", color: "slate" }
             ].map((stat, i) => (
               <div key={i} className="card p-6 border-0 shadow-md bg-white hover:ring-2 hover:ring-indigo-500/10 transition-all">
                  <div className={`h-10 w-10 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center mb-4 border border-${stat.color}-500/20`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
               </div>
             ))}
          </div>

          {showCreate ? (
            <div className="card p-10 max-w-2xl bg-white shadow-2xl border-0 animate-slide-in relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <FileText size={180} />
              </div>
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3 tracking-tight">
                <div className="h-6 w-1 bg-indigo-600 rounded-full"></div> DEPLOY NEW PROTOCOL
              </h2>
              <form onSubmit={handleCreateExam} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Protocol Title</label>
                    <input required type="text" className="input-field h-14 text-lg font-bold border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-2xl" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} placeholder="e.g. CORE ARCHITECTURE CERTIFICATION" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Operational Description</label>
                    <textarea className="input-field py-4 text-base font-medium border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-2xl" value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} placeholder="Specify parameters and objectives..." rows="3"></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Timeline (Minutes)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required type="number" className="input-field h-14 pl-12 font-bold border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-2xl" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Availability Window [Start]</label>
                    <input type="datetime-local" className="input-field h-14 font-bold border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-2xl" value={newExam.availableFrom} onChange={e => setNewExam({...newExam, availableFrom: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Availability Window [End]</label>
                    <input type="datetime-local" className="input-field h-14 font-bold border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 rounded-2xl" value={newExam.availableUntil} onChange={e => setNewExam({...newExam, availableUntil: e.target.value})} />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button type="submit" className="h-14 px-10 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/10 flex-1 uppercase tracking-tighter">Bootstrap Protocol</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="h-14 px-10 text-slate-500 bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 rounded-2xl transition-all font-black uppercase tracking-tighter">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in [animation-delay:400ms]">
              {exams.map(exam => (
                <div key={exam._id} className="card bg-white hover:ring-4 hover:ring-indigo-500/10 transition-all duration-500 flex flex-col group relative border-0 shadow-lg hover:shadow-2xl hover:-translate-y-2 overflow-visible">
                  {/* Status Badge */}
                  <div className="absolute -top-3 -left-3 z-20">
                    <div className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl border
                      ${exam.isActive ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'}
                    `}>
                      <div className={`h-1.5 w-1.5 rounded-full ${exam.isActive ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></div>
                      {exam.isActive ? 'Public protocol' : 'Under seal'}
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="p-8 pt-10 flex-1 flex flex-col cursor-pointer" onClick={() => navigate(`/admin/exam/${exam._id}/manage`)}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2 tracking-tighter">{exam.title}</h3>
                          <div className="h-0.5 w-12 bg-slate-100 group-hover:w-full group-hover:bg-indigo-600 transition-all duration-500"></div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 pr-4 italic">
                      {exam.description || 'No operational brief provided.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-auto mb-8">
                       <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-colors group-hover:bg-indigo-50/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Participants</p>
                          <div className="flex items-center gap-2">
                             <Users size={14} className="text-indigo-400" />
                             <span className="text-lg font-black text-slate-900 tracking-tighter">{exam.attemptCount || 0}</span>
                          </div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-colors group-hover:bg-indigo-50/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Timeframe</p>
                          <div className="flex items-center gap-2">
                             <Clock size={14} className="text-indigo-400" />
                             <span className="text-lg font-black text-slate-900 tracking-tighter">{exam.durationMinutes}'</span>
                          </div>
                       </div>
                    </div>

                    {(exam.availableFrom || exam.availableUntil) && (
                      <div className="space-y-2 py-4 px-5 bg-slate-50/80 rounded-2xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                        {exam.availableFrom && (
                          <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <div className="h-1 w-1 rounded-full bg-emerald-500"></div> START: {new Date(exam.availableFrom).toLocaleString()}
                          </div>
                        )}
                        {exam.availableUntil && (
                          <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <div className="h-1 w-1 rounded-full bg-red-500"></div> CLOSE: {new Date(exam.availableUntil).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between group-hover:bg-indigo-600 transition-all border-t border-slate-50 rounded-b-[32px]">
                     <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/exam/${exam._id}/results`); }}
                          className="h-10 w-10 bg-white rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all group-hover:scale-110 active:scale-90"
                          title="Operational Intelligence"
                        >
                          <BarChart3 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleExamStatus(exam._id, exam.isActive); }}
                          className={`h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center transition-all group-hover:scale-110 active:scale-90 ${exam.isActive ? 'text-amber-500' : 'text-emerald-500'}`}
                          title={exam.isActive ? "Withdraw Protocol" : "Authorize Protocol"}
                        >
                          {exam.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-[0.2em] transition-colors">Configure System</span>
                  </div>
                </div>
              ))}
              
              {exams.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border-4 border-dashed border-slate-100 animate-pulse-slow">
                  <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Null Records Detected</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">System is ready for assessment deployment</p>
                  <button onClick={() => setShowCreate(true)} className="btn-primary h-14 px-12 rounded-2xl shadow-2xl shadow-indigo-600/20">Initialize First Protocol</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminDashboard;
