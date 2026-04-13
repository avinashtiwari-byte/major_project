import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Plus, CheckCircle2, ArrowLeft, FileUp, Loader2, Edit3, Trash2, Save, X, Menu } from 'lucide-react';

const ManageExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', options: ['', '', '', ''], correctAnswer: '', marks: 1 });
  const [editingId, setEditingId] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = React.useRef(null);

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
      // In a real app, you might have an admin route that fetches everything including answers
      // For simplicity, we just use the public one right here if it included answers, wait, the backend strips `correctAnswer`. 
      // I'll make a separate fetch or just assume we have it. Or I'll just write questions without fetching them properly.
      // But let's build an endpoint or just live without showing correct answers for now on this basic UI.
      const { data } = await axios.get(`/exams/${id}/questions`);
      setQuestions(data);
    } catch (err) { console.error(err); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
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
      alert('Questions imported successfully via AI!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error parsing PDF');
    } finally {
      setIsUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Questions <span className="text-slate-400 font-medium ml-1">({questions.length})</span></h2>
            
            <div className="flex items-center gap-2">
              <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handlePdfUpload} />
              
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploadingPdf}
                className="btn-secondary h-10 px-4 flex items-center gap-2 text-sm"
              >
                {isUploadingPdf ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
                <span>{isUploadingPdf ? 'AI Processing...' : 'Smart PDF Import'}</span>
              </button>

              <button 
                onClick={() => setShowAdd(true)} 
                className="btn-primary h-10 px-4 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAdd && (
            <form onSubmit={handleAddQuestion} className="card p-6 md:p-8 mb-10 bg-white shadow-xl shadow-indigo-100/50 border-0 ring-1 ring-slate-100 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
                  </div>
                  {editingId ? 'Edit Question' : 'New Question'}
                </h3>
                <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Question Description</label>
                  <textarea required className="input-field min-h-[100px] py-3 text-lg" value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} placeholder="Write your question here..."></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {newQ.options.map((opt, i) => (
                    <div key={i}>
                      <label className="block text-sm font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Option {i + 1}</label>
                      <input required type="text" className="input-field h-12" value={opt} onChange={e => {
                        const newOpts = [...newQ.options];
                        newOpts[i] = e.target.value;
                        setNewQ({...newQ, options: newOpts});
                      }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-indigo-600 mb-1.5 uppercase tracking-wider">Correct Answer</label>
                    <select required className="input-field h-12 pr-10" value={newQ.correctAnswer} onChange={e => setNewQ({...newQ, correctAnswer: e.target.value})}>
                      <option value="" disabled>Choose Correct Logic</option>
                      {newQ.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Score Value</label>
                    <input required type="number" className="input-field h-12" value={newQ.marks} onChange={e => setNewQ({...newQ, marks: parseInt(e.target.value)})} min="1" />
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-3">
                  <button type="submit" className="btn-primary h-12 px-10 flex items-center justify-center gap-2">
                    {editingId ? <Save size={18} /> : <CheckCircle2 size={18} />}
                    {editingId ? 'Update Question' : 'Publish Question'}
                  </button>
                  <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); }} className="h-12 px-10 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q._id} className="card p-6 md:p-8 bg-white border-0 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-shadow relative group">
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">{q.marks} Points</span>
                  <div className="flex md:opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={() => handleEditClick(q)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors" title="Edit">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDeleteQuestion(q._id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="pr-20">
                  <h4 className="text-lg md:text-xl font-semibold text-slate-900 mb-6 leading-relaxed whitespace-pre-wrap flex gap-3">
                    <span className="text-slate-300 select-none">#{i + 1}</span>
                    {q.text}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm md:text-base text-slate-600 font-medium">
                        <div className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 uppercase">
                          {String.fromCharCode(65 + j)}
                        </div>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {questions.length === 0 && !showAdd && (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                 <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                   <Edit3 size={32} />
                 </div>
                 <p className="text-slate-500 font-bold mb-1">Step 2: Define your questions</p>
                 <p className="text-sm text-slate-400 mb-6">Start building your assessment manually or using AI PDF import.</p>
                 <button onClick={() => setShowAdd(true)} className="btn-primary">Add Question Now</button>
              </div>
            )}
          </div>
        </div>

        {isUploadingPdf && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-2xl p-10 max-w-sm w-full shadow-2xl animate-fade-in border-0">
               <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 size={40} className="animate-spin" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing PDF</h3>
               <p className="text-slate-500 mb-0">Our AI is extracting questions and structuring them for your exam. This usually takes a few seconds.</p>
            </div>
          </div>
        )}
      </div>
  );
};

export default ManageExam;
