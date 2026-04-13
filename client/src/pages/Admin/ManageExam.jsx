import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Plus, CheckCircle2, ArrowLeft, FileUp, Loader2, Edit3, Trash2, Save, X, Eye, Copy, Check } from 'lucide-react';

const ManageExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
  const [editingId, setEditingId] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchExam();
    fetchQuestions();
  }, [id]);

  const fetchExam = async () => {
    try {
      const { data } = await axios.get(`/exams/${id}`);
      setExam(data);
    } catch (err) { console.error(err); }
  };

  const fetchQuestions = async () => {
    try {
      const { data } = await axios.get(`/exams/${id}/questions`);
      setQuestions(data);
    } catch (err) { console.error(err); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (newQ.options.some(opt => !opt.trim())) {
      alert("All options must be filled.");
      return;
    }
    if (!newQ.correctAnswer) {
      alert("Please select the correct answer.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/exams/${id}/questions/${editingId}`, newQ);
        setEditingId(null);
      } else {
        await axios.post(`/exams/${id}/questions`, newQ);
      }
      setShowAdd(false);
      setNewQ({ text: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
      fetchQuestions();
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await axios.delete(`/exams/${id}/questions/${qId}`);
      fetchQuestions();
    } catch (err) { console.error(err); }
  };

  const handleEditClick = (q) => {
    setNewQ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer, marks: q.marks });
    setEditingId(q._id);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('examPdf', file);

    setIsUploadingPdf(true);
    try {
      await axios.post(`/exams/${id}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error parsing PDF');
    } finally {
      setIsUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/student/exam/${id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-12 bg-[#fdfdff] min-h-screen">
      <div className="max-w-5xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-12 animate-fade-in">
            <button onClick={() => navigate('/admin')} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Terminal
            </button>
            <div className="flex items-center gap-3">
               <button 
                onClick={copyInviteLink}
                className="btn-secondary h-11 px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm border-2 border-slate-100 hover:border-indigo-600"
               >
                 {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                 {copied ? 'Copied' : 'Invite Link'}
               </button>
               <button 
                onClick={() => navigate(`/admin/exam/${id}/results`)}
                className="btn-secondary h-11 px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm border-2 border-slate-100"
               >
                 <Eye size={14} /> Analytics
               </button>
            </div>
          </div>

          {/* Header Info */}
          <header className="mb-16 animate-fade-in [animation-delay:100ms]">
            <div className="flex items-center gap-2 mb-4">
               <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Configuration Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
              Protocol: <span className="text-indigo-600 italic uppercase">{exam?.title}</span>
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">{questions.length} Items Loaded</div>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-100">{questions.reduce((acc, q) => acc + (q.marks || 0), 0)} Total Score</div>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Section */}
            <div className="flex-1 space-y-8 animate-fade-in [animation-delay:300ms]">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                   <div className="h-4 w-1 bg-indigo-600 rounded-full"></div> Question Matrix
                 </h2>
                 <div className="flex items-center gap-3">
                   <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handlePdfUpload} />
                   <button onClick={() => fileInputRef.current?.click()} className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                     <FileUp size={14} /> AI PDF Import
                   </button>
                   {!showAdd && (
                     <button onClick={() => setShowAdd(true)} className="h-10 px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10">
                       <Plus size={14} /> New Item
                     </button>
                   )}
                 </div>
              </div>

              {showAdd && (
                <div className="card p-10 bg-white border-0 shadow-2xl rounded-[40px] animate-slide-in relative overflow-hidden ring-1 ring-slate-100">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Edit3 size={100} />
                  </div>
                  <h3 className="text-xl font-black mb-10 tracking-tighter uppercase flex items-center justify-between">
                    {editingId ? 'Modify Strategy' : 'Define New Entry'}
                    <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                      <X size={18} />
                    </button>
                  </h3>
                  <form onSubmit={handleAddQuestion} className="space-y-8 relative z-10">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Body</label>
                       <textarea required className="input-field min-h-[120px] py-6 text-lg font-bold border-2 border-slate-100 focus:border-indigo-600 rounded-[24px]" value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} placeholder="Specify the assessment inquiry..."></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {newQ.options.map((opt, i) => (
                         <div key={i} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Option Vector {String.fromCharCode(65+i)}</label>
                            <input required type="text" className="input-field h-14 font-bold border-2 border-slate-100 focus:border-indigo-600 rounded-[20px]" value={opt} onChange={e => {
                               const newOpts = [...newQ.options];
                               newOpts[i] = e.target.value;
                               setNewQ({...newQ, options: newOpts});
                            }} />
                         </div>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Validated Resolution</label>
                          <select required className="input-field h-14 font-black border-2 border-indigo-100 focus:border-indigo-600 rounded-[20px] appearance-none cursor-pointer bg-indigo-50/30" value={newQ.correctAnswer} onChange={e => setNewQ({...newQ, correctAnswer: e.target.value})}>
                             <option value="" disabled>SELECT CORRECT VECTOR</option>
                             {newQ.options.map((opt, i) => opt && <option key={i} value={opt}>{String.fromCharCode(65+i)}: {opt}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Point Weighting</label>
                          <input required type="number" className="input-field h-14 font-black border-2 border-slate-100 focus:border-indigo-600 rounded-[20px]" value={newQ.marks} onChange={e => setNewQ({...newQ, marks: parseInt(e.target.value)})} min="1" />
                       </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                       <button type="submit" className="h-14 px-10 bg-indigo-600 text-white font-black rounded-2xl flex-1 uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-600/20">
                          {editingId ? 'COMMIT CHANGES' : 'DEPLOY INQUIRY'}
                       </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {questions.map((q, i) => (
                  <div key={q._id} className="card p-8 bg-white border-0 shadow-sm hover:shadow-2xl hover:ring-2 hover:ring-indigo-100 transition-all duration-500 group relative rounded-[32px]">
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                       <div className="flex opacity-0 group-hover:opacity-100 transition-all gap-2 transform translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => handleEditClick(q)} className="h-10 w-10 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all rounded-xl flex items-center justify-center">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteQuestion(q._id)} className="h-10 w-10 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-md transition-all rounded-xl flex items-center justify-center">
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </div>

                    <div className="flex gap-6">
                       <div className="h-12 w-12 bg-slate-50 text-slate-300 rounded-2xl font-black flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                          {i + 1}
                       </div>
                       <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-6 cursor-default">
                             <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-400 rounded-full border border-slate-200">Weight: {q.marks || 1} Pts</span>
                             <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-500 rounded-full border border-indigo-100">Correct: {q.correctAnswer || 'N/A'}</span>
                          </div>
                          
                          <h4 className="text-xl font-bold text-slate-900 mb-8 leading-tight tracking-tight whitespace-pre-wrap">{q.text}</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {q.options.map((opt, j) => (
                               <div key={j} className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${opt === q.correctAnswer ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className={`h-8 w-8 rounded-xl font-black text-[10px] flex items-center justify-center border transition-all ${opt === q.correctAnswer ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-4 ring-indigo-500/10' : 'bg-white text-slate-400 border-slate-200'}`}>
                                    {String.fromCharCode(65 + j)}
                                  </div>
                                  <span className={`font-bold transition-all ${opt === q.correctAnswer ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && !showAdd && (
                  <div className="h-[400px] flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[40px] bg-white animate-pulse-slow">
                     <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                        <Plus size={40} />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Empty Question Matrix</h3>
                     <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10">Configure inquiries via manual entry or AI import</p>
                     <button onClick={() => setShowAdd(true)} className="h-14 px-12 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-600/20 uppercase tracking-widest text-xs">Initialize First Inquiry</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Loading Overlay for PDF */}
        {isUploadingPdf && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-10 animate-fade-in">
            <div className="bg-white rounded-[40px] p-12 max-w-sm w-full shadow-3xl text-center border-0">
               <div className="h-24 w-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-inner">
                  <Loader2 size={48} className="animate-spin" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Optimizing Matrix</h3>
               <p className="text-slate-500 font-medium leading-relaxed italic">Synchronizing neural extraction protocols. This system optimization usually concludes in seconds.</p>
            </div>
          </div>
        )}
      </div>
  );
};

export default ManageExam;
