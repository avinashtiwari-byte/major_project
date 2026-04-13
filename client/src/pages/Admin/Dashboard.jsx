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
    <div className="flex-1 p-4 md:p-10 w-full">
      <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">Dashboard</h1>
              <p className="text-slate-500 text-sm md:text-base mt-1">Manage your examination system and track student participation.</p>
            </div>
            {!showCreate && (
              <button onClick={() => setShowCreate(true)} className="btn-primary w-full sm:w-auto h-11 flex items-center justify-center gap-2">
                <Plus size={18} /> New Assessment
              </button>
            )}
          </div>

          {showCreate ? (
            <div className="card p-6 md:p-8 max-w-2xl bg-white shadow-xl shadow-slate-200/50 animate-fade-in border-0">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-indigo-600" /> Create New Exam
              </h2>
              <form onSubmit={handleCreateExam} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Exam Title</label>
                  <input required type="text" className="input-field h-12 text-lg" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} placeholder="e.g. Advanced Java Certification" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea className="input-field py-3 text-base" value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} placeholder="Provide key instructions or objectives for this exam..." rows="4"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Duration (Minutes)</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input required type="number" className="input-field h-12 pl-11" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Available From</label>
                    <input type="datetime-local" className="input-field h-12" value={newExam.availableFrom} onChange={e => setNewExam({...newExam, availableFrom: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Available Until</label>
                    <input type="datetime-local" className="input-field h-12" value={newExam.availableUntil} onChange={e => setNewExam({...newExam, availableUntil: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <button type="submit" className="btn-primary h-12 px-8 flex-1 sm:flex-none">Bootstrap Exam</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="h-12 px-8 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all font-semibold flex-1 sm:flex-none text-center">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
              {exams.map(exam => (
                <div key={exam._id} className="card bg-white hover:ring-2 hover:ring-indigo-500/20 transition-all duration-300 flex flex-col group relative border-0 shadow-sm">
                  {/* Sidebar / Additional Info */}
                  <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-start">
                    <div className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                      ${exam.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {exam.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {exam.isActive ? 'Published' : 'Draft'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/exam/${exam._id}/results`); }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title="View Student Performance"
                      >
                        <BarChart3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExamStatus(exam._id, exam.isActive); }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title={exam.isActive ? "Unpublish Test" : "Publish Test"}
                      >
                        {exam.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col cursor-pointer" onClick={() => navigate(`/admin/exam/${exam._id}/manage`)}>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">{exam.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-6">{exam.description || 'Quickly set up questions and start assessment.'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium leading-none mb-1">Students</p>
                          <p className="font-bold text-slate-900 leading-none">{exam.attemptCount || 0}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium leading-none mb-1">Minutes</p>
                          <p className="font-bold text-slate-900 leading-none">{exam.durationMinutes}</p>
                        </div>
                      </div>
                    </div>

                    {(exam.availableFrom || exam.availableUntil) && (
                      <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                        {exam.availableFrom && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <Clock size={12} className="text-indigo-400" /> Opens: {new Date(exam.availableFrom).toLocaleString()}
                          </div>
                        )}
                        {exam.availableUntil && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <Clock size={12} className="text-red-400" /> Closes: {new Date(exam.availableUntil).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between group-hover:bg-indigo-50 transition-colors border-t border-slate-50">
                     <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-500 uppercase tracking-widest transition-colors">Configure Test</span>
                     <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                       <MoreVertical size={14} />
                     </div>
                  </div>
                </div>
              ))}
              
              {exams.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <FileText size={32} />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">Your assessment library is empty</p>
                  <p className="text-slate-400 text-sm mb-6">Create multiple choice exams and track results in real-time.</p>
                  <button onClick={() => setShowCreate(true)} className="btn-primary">Create Your First Exam</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminDashboard;
