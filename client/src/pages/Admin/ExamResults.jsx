import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertTriangle, ChevronRight, Search, Download, Clock, Eye, BarChart3 } from 'lucide-react';

const AdminExamResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const eRes = await axios.get(`/exams/${id}`);
      const rRes = await axios.get(`/results/exam/${id}`);
      setExam(eRes.data);
      setResults(rRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(r => 
    r.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIntegrityColor = (switches) => {
    if (switches === 0) return 'text-emerald-500 bg-emerald-50';
    if (switches < 3) return 'text-amber-500 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Analytics...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-12 pb-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-tight">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <BarChart3 size={20} />
                 </div>
                 <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">Performance <span className="text-indigo-400">Records</span></h1>
               </div>
               <p className="text-slate-400 font-medium text-lg">{exam?.title} — Student Statistics</p>
             </div>

             <div className="flex items-center gap-4">
               <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Global Avg</p>
                  <p className="text-2xl font-black">
                    {results.length > 0 
                      ? Math.round(results.reduce((acc, r) => acc + (r.score/r.totalMarks)*100, 0) / results.length) 
                      : 0}%
                  </p>
               </div>
               <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Total Enrolled</p>
                  <p className="text-2xl font-black">{results.length}</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-12">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-900/5 border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student by name or email..."
                  className="w-full pl-12 pr-4 h-12 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all font-medium text-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="h-12 px-6 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-indigo-600 transition-colors">
                <Download size={18} /> EXPORT CSV
             </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assessment Score</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Integrity (Tab Switches)</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Submission Date</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResults.map((result) => (
                  <tr key={result._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-sm">
                          {result.userId?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-none mb-1">{result.userId?.name}</p>
                          <p className="text-xs text-slate-400">{result.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${(result.score/result.totalMarks)*100}%` }}></div>
                         </div>
                         <span className="font-black text-slate-900">{result.score} <span className="text-slate-300">/ {result.totalMarks}</span></span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getIntegrityColor(result.tabSwitches)}`}>
                         {result.tabSwitches > 0 ? <AlertTriangle size={12}/> : <Clock size={12}/>}
                         {result.tabSwitches} Switches
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs font-bold text-slate-500">{new Date(result.completedAt).toLocaleDateString()}</p>
                       <p className="text-[10px] text-slate-300 font-medium">{new Date(result.completedAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => navigate(`/student/results/${result._id}`)}
                         className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 text-indigo-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                       >
                          <Eye size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center">
                 <Users className="text-slate-100" size={64}/>
                 <p className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-xs">No records found for this assessment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExamResults;
