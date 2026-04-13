import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Award, CheckCircle, XCircle, ArrowLeft, BarChart3, AlertTriangle } from 'lucide-react';

const ResultDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (id) {
      fetchResultDetails();
    } else {
      fetchAllResults();
    }
  }, [id]);

  const fetchResultDetails = async () => {
    try {
      const { data } = await axios.get(`/results/${id}`);
      setResult(data);
      
      // Fetch global comparison stats for this exam
      const statsRes = await axios.get(`/results/exam/${data.examId?._id}/stats`);
      setStats(statsRes.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllResults = async () => {
    try {
      const { data } = await axios.get('/results/my-results');
      setAllResults(data);
    } catch (err) { console.error(err); }
  };

  if (!id) {
    // List all results
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/student')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <Award className="text-primary"/> My Exam Results
          </h1>

          <div className="space-y-4">
            {allResults.map(res => (
              <div key={res._id} className="card p-6 flex items-center justify-between hover:-translate-y-1 transition-transform group cursor-pointer" onClick={() => navigate(`/student/results/${res._id}`)}>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{res.examId?.title}</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-3">
                    <span>Taken on: {new Date(res.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-primary">{res.score} <span className="text-base font-medium text-slate-400">/ {res.totalMarks}</span></div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Score</div>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                    →
                  </div>
                </div>
              </div>
            ))}
            {allResults.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                You haven't completed any exams yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Specific Result Details
  if (!result) return <div className="p-10 text-center">Loading result...</div>;

  const percentage = (result.score / result.totalMarks) * 100;
  let gradeColor = 'text-green-500';
  if (percentage < 40) gradeColor = 'text-red-500';
  else if (percentage < 70) gradeColor = 'text-amber-500';

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => navigate(isAdmin ? -1 : '/student/results')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-all font-bold group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> {isAdmin ? 'BACK TO ANALYTICS' : 'BACK TO MY RESULTS'}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2 card p-10 bg-slate-900 border-0 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <h2 className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase">Academic Performance Script</h2>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter leading-tight">{result.examId?.title}</h1>
              <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <span>Completed: {new Date(result.completedAt).toLocaleString()}</span>
              </div>
            </div>
            {/* Background decorative blob */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Award size={120} className="text-white" />
            </div>
          </div>
          
          <div className="card p-8 border-0 shadow-xl flex flex-col items-center justify-center text-center bg-white">
            <div className={`text-6xl font-black mb-2 tracking-tighter ${gradeColor}`}>{Math.round(percentage)}%</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
              RESULT SCORE: <span className="text-slate-900">{result.score}</span> / {result.totalMarks}
            </div>
          </div>
        </div>

        {/* Verification Summary & Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="card p-8 border-0 shadow-lg bg-white relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
               <div className="h-4 w-1 bg-amber-500 rounded-full"></div> PROCTORING INTEGRITY
            </h3>
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center transition-transform hover:scale-105">
                <div className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">Tab Switches</div>
                <div className={`text-4xl font-black ${result.tabSwitches > 0 ? 'text-red-500' : 'text-indigo-600'}`}>{result.tabSwitches}</div>
                {result.tabSwitches > 0 && <p className="text-[8px] font-bold text-red-400 mt-3 uppercase tracking-tighter bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Integrity Risk</p>}
              </div>
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col items-center transition-transform hover:scale-105">
                <div className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">Visual Evidence</div>
                <div className="text-4xl font-black text-slate-900">{result.snapshots?.length || 0}</div>
                <p className="text-[8px] font-bold text-slate-400 mt-3 uppercase tracking-tighter bg-slate-200 px-2 py-0.5 rounded-full">Encrypted Logs</p>
              </div>
            </div>
          </div>

          <div className="card p-8 border-0 shadow-lg bg-white">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
               <div className="h-4 w-1 bg-indigo-500 rounded-full"></div> GLOBAL METRICS
            </h3>
            {stats ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-indigo-600">Your Score ({result.score})</span>
                    <span className="text-slate-400">Target Level</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${(result.score / result.totalMarks) * 100}%` }}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Class Median ({stats.averageScore})</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full transition-all duration-1000" style={{ width: `${(stats.averageScore / result.totalMarks) * 100}%` }}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-emerald-500">
                    <span>Tier 1 Score ({stats.topScore})</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-emerald-50">
                    <div className="h-full bg-emerald-500/30 rounded-full transition-all duration-1000" style={{ width: `${(stats.topScore / result.totalMarks) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">
                Synchronizing Assessment Data...
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-black mb-8 text-slate-900 flex items-center gap-3">
          <BarChart3 className="text-indigo-600" size={24}/> ANALYSIS BREAKDOWN
        </h3>

        <div className="space-y-6">
          {result.answers.map((ans, i) => (
            <div key={ans._id || ans.questionId?._id} className="card p-8 border-0 shadow-md bg-white hover:shadow-xl hover:ring-1 hover:ring-indigo-100 transition-all group">
              <div className="flex gap-6">
                <div className="mt-1">
                  {ans.isCorrect ? (
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle size={18} />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20">
                      <XCircle size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {i+1}</span>
                    <span className={`h-1 w-1 rounded-full ${ans.isCorrect ? 'bg-emerald-300' : 'bg-red-300'}`}></span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Value: {result.answers[i].questionId?.marks || 0}Pts</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 mb-6 leading-tight whitespace-pre-wrap">{ans.questionId?.text || 'Question text unavailable'}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border-2 transition-all ${ans.isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Student Response</span> 
                      <p className={`text-base font-bold ${ans.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                        {ans.selectedOption || 'NOT ATTEMPTED'}
                      </p>
                    </div>
                    {!ans.isCorrect && ans.questionId?.correctAnswer && (
                      <div className="p-5 rounded-2xl bg-indigo-50/30 border-2 border-indigo-100 transition-all">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Validated Protocol Answer</span> 
                        <p className="text-base font-bold text-indigo-900">{ans.questionId.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultDashboard;
