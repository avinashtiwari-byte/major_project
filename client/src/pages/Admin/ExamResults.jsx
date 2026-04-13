import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertTriangle, ChevronRight, Search, Download, Clock, Eye, BarChart3, Camera, X, ShieldAlert } from 'lucide-react';

const AdminExamResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);

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
    if (switches === 0) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (switches < 3) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-red-500 bg-red-50 border-red-100';
  };

  const openEvidence = (result) => {
    setSelectedResult(result);
    setShowEvidence(true);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fdfdff]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
          <div className="absolute inset-0 border-t-4 border-indigo-600 rounded-3xl animate-spin"></div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Synchronizing Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfdff] pb-24 px-6 md:px-12 pt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-16 animate-fade-in">
           <button onClick={() => navigate('/admin')} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest">
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Terminal
           </button>
           <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Analytics Feed Active</span>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16 animate-fade-in [animation-delay:100ms]">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6">
               Performance <span className="text-indigo-600 italic">Intelligence</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg md:text-xl flex items-center gap-3 italic">
              <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
              {exam?.title} — Global Candidate Statistics
            </p>
          </div>

          <div className="flex items-center gap-6">
             <div className="card p-8 bg-white border-0 shadow-lg min-w-[180px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <BarChart3 size={60} />
                </div>
                <p className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">Success Metric</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">
                  {results.length > 0 
                    ? Math.round(results.reduce((acc, r) => acc + (r.score/r.totalMarks)*100, 0) / results.length) 
                    : 0}<span className="text-indigo-600">%</span>
                </p>
             </div>
             <div className="card p-8 bg-white border-0 shadow-lg min-w-[180px] relative overflow-hidden group border-t-4 border-indigo-600">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <Users size={60} />
                </div>
                <p className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">Processed Nodes</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{results.length}</p>
             </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-fade-in [animation-delay:200ms]">
           <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search candidate by nominal or email..."
                className="w-full pl-14 pr-6 h-16 bg-white border-2 border-slate-50 rounded-[28px] shadow-sm focus:border-indigo-600 focus:shadow-xl focus:shadow-indigo-600/5 transition-all font-bold text-slate-800 outline-none placeholder:italic placeholder:font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="h-16 px-10 bg-slate-900 text-white font-black rounded-[28px] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 uppercase tracking-widest text-xs">
              <Download size={18} /> Generate Data Report
           </button>
        </div>

        {/* Table/List */}
        <div className="bg-white rounded-[48px] shadow-3xl shadow-indigo-900/5 border border-slate-50 overflow-hidden animate-fade-in [animation-delay:300ms]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="pl-12 pr-6 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Candidate nominal</th>
                  <th className="px-6 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Final Protocol Result</th>
                  <th className="px-6 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Integrity Audit</th>
                  <th className="px-6 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                  <th className="pr-12 pl-6 py-8 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResults.map((result) => (
                  <tr key={result._id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="pl-12 pr-6 py-8">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                          {result.userId?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-none mb-2 tracking-tighter uppercase italic">{result.userId?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{result.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8">
                       <div className="flex items-center gap-4">
                          <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                             <div className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(result.score/result.totalMarks)*100}%` }}></div>
                          </div>
                          <span className="font-black text-2xl text-slate-900 tracking-tighter">{result.score} <span className="text-slate-200">/ {result.totalMarks}</span></span>
                       </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                       <div 
                         className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border-2 shadow-sm cursor-help hover:scale-105 transition-transform ${getIntegrityColor(result.tabSwitches)}`}
                         title={`${result.tabSwitches} Unauthorized focus shifts detected.`}
                       >
                         {result.tabSwitches > 0 ? <AlertTriangle size={14} className="animate-pulse" /> : <ShieldAlert size={14}/>}
                         {result.tabSwitches > 0 ? `${result.tabSwitches} BREACHES` : 'VALID SESSION'}
                       </div>
                    </td>
                    <td className="px-6 py-8">
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{new Date(result.completedAt).toLocaleDateString()}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{new Date(result.completedAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="pr-12 pl-6 py-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <button 
                            onClick={() => openEvidence(result)}
                            className="h-12 w-12 rounded-2xl bg-white shadow-md text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all border border-slate-50 hover:scale-110 active:scale-95"
                            title="Visual Audit Logs"
                          >
                            <Camera size={20} />
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/results/${result._id}`)}
                            className="h-12 w-12 rounded-2xl bg-slate-900 shadow-lg text-white hover:bg-indigo-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-indigo-600/10"
                            title="Detailed Evaluation Report"
                          >
                             <Eye size={20} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center bg-white">
                 <div className="h-24 w-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-100 mb-8 border-2 border-dashed border-slate-100">
                    <Users size={48}/>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">Null Records Detected</h3>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">No candidate data matches search parameters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Evidence Terminal Overlay */}
      {showEvidence && selectedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEvidence(false)}></div>
          <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-[48px] shadow-3xl relative z-10 overflow-hidden flex flex-col border-0">
            {/* Modal Header */}
            <div className="p-8 md:p-12 border-b border-slate-50 flex items-center justify-between bg-white relative z-20">
              <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Audit Log Terminal</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Candidate: <span className="text-indigo-600">{selectedResult.userId?.name}</span></h2>
              </div>
              <button 
                onClick={() => setShowEvidence(false)}
                className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50/30">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {selectedResult.snapshots && selectedResult.snapshots.length > 0 ? (
                    selectedResult.snapshots.map((img, i) => (
                      <div key={i} className="group relative rounded-[32px] overflow-hidden bg-slate-200 aspect-video shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-4 border-white">
                         <img src={img} alt={`Log ${i+1}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                         <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/80 to-transparent text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Log Entry {i+1}</p>
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-2">
                               <Camera size={10} className="text-indigo-400" /> Auto-Capture Protocol Verified
                            </p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                       <ShieldAlert size={64} className="text-slate-100 mb-6" />
                       <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Null Visual Evidence</h4>
                       <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed max-w-xs">Attempt to retrieve facial metadata failed. Candidate may have obstructed imaging device.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</span>
                     <span className="text-2xl font-black text-slate-900 leading-none">{selectedResult.snapshots?.length || 0}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-100"></div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Intensity</span>
                     <span className={`text-2xl font-black leading-none ${selectedResult.tabSwitches > 3 ? 'text-red-500' : 'text-indigo-600'}`}>
                        {selectedResult.tabSwitches > 5 ? 'High Critical' : selectedResult.tabSwitches > 0 ? 'Elevated' : 'Nominal'}
                     </span>
                  </div>
               </div>
               <button className="h-14 px-10 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/10 uppercase tracking-widest text-[10px]">Verify Candidate Score</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamResults;
