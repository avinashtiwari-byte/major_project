import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { AlertCircle, Clock, Maximize, ShieldAlert, CheckCircle, ChevronRight, Monitor, Camera, Lock, CameraOff, AlertTriangle, Loader2, Save } from 'lucide-react';

const ExamRoom = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Verification State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [snapshots, setSnapshots] = useState([]);
  const webcamRef = useRef(null);
  const snapshotInterval = useRef(null);
  const detectionInterval = useRef(null);
  const [warningMsg, setWarningMsg] = useState("");
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [faceCount, setFaceCount] = useState(1); // Assume 1 initially
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadModels();
    fetchExamData();
    // Cleanup intervals/listeners on unmount
    return () => {
      clearInterval(snapshotInterval.current);
      clearInterval(detectionInterval.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  const loadModels = async () => {
    try {
      // Using CDN for models to avoid local asset management issues
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      ]);
      setIsModelsLoaded(true);
    } catch (err) {
      console.error("Error loading face detection models:", err);
    }
  };

  const fetchExamData = async () => {
    try {
      const eRes = await axios.get(`/exams/${id}`);
      const qRes = await axios.get(`/exams/${id}/questions`);
      setExam(eRes.data);
      setQuestions(qRes.data);
      setTimeLeft(eRes.data.durationMinutes * 60);
      
      const initialAnswers = qRes.data.map(q => ({ questionId: q._id, selectedOption: null }));
      setAnswers(initialAnswers);
    } catch (err) { 
      console.error(err);
      setError(err.response?.data?.message || "Failed to establish connection with the assessment server. It might be a draft or deleted.");
    }
  };

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setTabSwitches(prev => {
        const newCount = prev + 1;
        setWarningMsg(`WARNING: Tab switch detected! You have left the exam window. (${newCount} times)`);
        setTimeout(() => setWarningMsg(""), 5000);
        return newCount;
      });
    }
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const captureSnapshot = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsSaving(true);
        setSnapshots(prev => [...prev, imageSrc]);
        setTimeout(() => setIsSaving(false), 2000);
      }
    }
  }, [webcamRef]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log(err));
    }
  };

  const startExam = () => {
    setIsStarted(true);
    enterFullscreen();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Capture snapshot every 30 seconds
    snapshotInterval.current = setInterval(captureSnapshot, 30000);
    // Start face detection every 2 seconds
    detectionInterval.current = setInterval(runFaceDetection, 2000);

    // Take initial snapshot
    setTimeout(captureSnapshot, 2000); 
  };

  const runFaceDetection = async () => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
      
      const count = detections.length;
      setFaceCount(count);

      if (count > 1) {
        setWarningMsg("SECURITY ALERT: Multiple persons detected! You must be alone.");
        captureSnapshot(); // Auto-snapshot as proof
      } else if (count === 0) {
        setWarningMsg("SECURITY WARNING: No face detected! Please stay in view of the camera.");
      } else {
        // If it was showing a face warning before, clear it. 
        // But don't clear tab switch warnings (they have their own timeout)
        setWarningMsg(prev => (prev.includes("detected") ? "" : prev));
      }
    }
  };

  // Timer Countdown
  useEffect(() => {
    let timerId;
    if (isStarted && timeLeft > 0 && !isSubmitting) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            submitExam(); // Auto-submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isStarted, isSubmitting, timeLeft]);

  const handleAnswerSelect = (qId, option) => {
    setAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, selectedOption: option } : a));
  };

  const submitExam = async (confirmed = false) => {
    if (isSubmitting) return;

    if (!confirmed && timeLeft > 0) {
      setShowConfirm(true);
      return;
    }

    setShowConfirm(false);
    setIsSubmitting(true);
    // Final snapshot before submit
    captureSnapshot();

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
      
      const payload = {
        answers: answers.filter(a => a.selectedOption !== null),
        snapshots,
        tabSwitches
      };
      
      const { data } = await axios.post(`/exams/${id}/submit`, payload);
      
      if (data.success) {
        navigate(`/student/results/${data.resultId}`);
      } else {
        throw new Error(data.message || "Submission failed on server.");
      }
    } catch (err) {
      console.error('Submission error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error submitting exam!';
      alert(`SUBMISSION FAILED: ${errorMsg}\n\nPlease try again. If the issue persists, contact your administrator.`);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-red-100">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Technical Error</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
        <button onClick={() => navigate('/student')} className="btn-primary w-full h-12">
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  if (!exam) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Decrypting Assessment...</p>
      </div>
    </div>
  );

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-slate-900/50 backdrop-blur-xl rounded-[40px] p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Decorative background flare */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-8 p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 inline-block shadow-inner">
              <ShieldAlert className="text-indigo-400" size={48} />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight uppercase italic text-indigo-100">
              EXAM <span className="text-white">INITIATION</span>
            </h1>
            <p className="text-slate-400 text-base md:text-xl mb-10 font-medium max-w-xl mx-auto">
              You are entering an encrypted examination protocol. Strict proctoring rules are in active effect.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
               <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex items-center gap-4 text-left">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Duration</h4>
                    <p className="font-bold text-white leading-none">{exam.durationMinutes} Minutes</p>
                  </div>
               </div>
               <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex items-center gap-4 text-left">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Display</h4>
                    <p className="font-bold text-white leading-none">Force Fullscreen</p>
                  </div>
               </div>
            </div>

            <div className="w-full space-y-3 mb-12">
               {[
                 "Webcam & Face verification is required.",
                 "Tab switching will be logged & flagged.",
                 "Auto-submit will trigger when time expires."
               ].map((text, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm text-slate-300 bg-slate-800/20 py-3 px-5 rounded-xl border border-white/5">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                   {text}
                 </div>
               ))}
            </div>

            <button 
              onClick={startExam} 
              className="group w-full md:w-auto px-12 h-16 bg-white hover:bg-indigo-500 text-slate-900 hover:text-white font-black rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-white/10"
            >
              START ASSESSMENT <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorized Students Only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col h-screen overflow-hidden select-none">
      {/* Warning Toast */}
      {warningMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-red-500 shadow-red-600/20">
            <AlertTriangle size={24} className="animate-pulse" />
            <span className="font-black text-sm uppercase tracking-tight">{warningMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 h-20 px-6 md:px-10 flex items-center justify-between text-white shrink-0 shadow-xl relative z-40">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-black leading-none uppercase tracking-tighter">{exam.title}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Assessment Session-Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-5">
          {isSaving && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full animate-fade-in">
              <span className="h-1 w-1 rounded-full bg-indigo-400 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">Synchronizing Logs</span>
            </div>
          )}
          <div className={`h-12 px-4 md:px-6 rounded-2xl flex items-center gap-2 md:gap-3 transition-colors ${timeLeft < 300 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white border border-white/10'}`}>
            <Clock size={20} className={timeLeft < 300 ? 'animate-spin-slow' : ''} />
            <span className="font-black text-lg md:text-2xl tracking-tighter tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={submitExam} 
            disabled={isSubmitting}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95 disabled:grayscale"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="hidden sm:inline">SUBMIT TEST</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Exam Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 pb-32">
          <div className="max-w-3xl mx-auto space-y-8">
            {questions?.map((q, index) => {
              const currentAns = answers?.find(a => a.questionId === q._id)?.selectedOption;
              return (
                <div key={q._id} className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-indigo-600 transition-colors"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Question {index + 1}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400">Score: {q.marks} Pts</span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-8 leading-snug whitespace-pre-wrap">{q.text}</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {q.options?.map((opt, i) => (
                      <label 
                        key={i} 
                        className={`group/opt relative flex items-center gap-4 p-5 md:p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                          currentAns === opt 
                            ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-600/5' 
                            : 'border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                           currentAns === opt ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200 bg-white'
                        }`}>
                           {currentAns === opt && <div className="h-2 w-2 rounded-full bg-white"></div>}
                        </div>
                        <input 
                          type="radio" 
                          name={`question-${q._id}`} 
                          value={opt}
                          checked={currentAns === opt}
                          onChange={() => handleAnswerSelect(q._id, opt)}
                          className="hidden"
                        />
                        <span className={`text-base md:text-lg font-bold transition-colors ${currentAns === opt ? 'text-indigo-900' : 'text-slate-600'}`}>
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proctoring Sidebar (Visible on LG screens) */}
        <aside className="w-80 shrink-0 border-l border-slate-100 bg-white p-8 overflow-y-auto hidden lg:flex flex-col gap-6">
           <div className="flex items-center gap-2 mb-2">
             <div className="h-3 w-3 rounded-full bg-indigo-600 animate-pulse"></div>
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Live Monitor Active</h4>
           </div>

           <div className="bg-slate-900 rounded-[32px] overflow-hidden aspect-video relative shadow-2xl border-4 border-white ring-1 ring-slate-100">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover grayscale opacity-80"
                videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
              />
              <div className="absolute inset-0 border-[20px] border-indigo-500/10 pointer-events-none"></div>
              <div className="absolute top-4 left-4 flex gap-1 items-center">
                 <Camera size={14} className="text-white" />
                 <span className="text-[8px] font-black text-white tracking-widest uppercase">Cam-01</span>
              </div>
           </div>

           <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-slate-400">Integrity Score</span>
                 <span className="text-lg font-black text-indigo-600">{100 - (tabSwitches * 10)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${Math.max(0, 100 - (tabSwitches * 10))}%` }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                   <Clock size={16} className="text-slate-300 mb-2" />
                   <span className="text-xs font-black text-slate-900">{timeLeft < 0 ? 'Exp' : formatTime(timeLeft)}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Remaining</span>
                 </div>
                 <div className={`p-4 rounded-2xl shadow-sm border flex flex-col items-center transition-colors ${faceCount !== 1 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                   <Camera size={16} className={faceCount !== 1 ? 'text-red-500 mb-2' : 'text-slate-300 mb-2'} />
                   <span className={`text-xs font-black ${faceCount !== 1 ? 'text-red-700' : 'text-slate-900'}`}>{faceCount}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Person(s)</span>
                 </div>
              </div>
           </div>

           <div className="mt-auto space-y-4">
              {!isModelsLoaded && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase italic">Initializing AI Guard...</span>
                </div>
              )}
              <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-4">
                 <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-indigo-600 uppercase">
                    {user?.name?.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate uppercase">{user?.name}</p>
                    <p className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">Verified</p>
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirm(false)}></div>
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl relative z-10 animate-slide-in border-0">
            <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
               <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-black text-center text-slate-900 mb-4 tracking-tight uppercase">Submit Protocol?</h2>
            <p className="text-slate-500 text-center font-medium mb-10 leading-relaxed px-4">
              Are you sure you want to end your assessment session? You have <span className="text-indigo-600 font-bold">{formatTime(timeLeft)}</span> remaining.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => submitExam(true)} 
                className="h-14 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-sm"
              >
                CONFIRM SUBMISSION
              </button>
              <button 
                onClick={() => setShowConfirm(false)} 
                className="h-12 text-slate-400 hover:text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]"
              >
                Return to Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Proctor Indicator for Mobile */}

      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <div className="h-12 w-12 bg-slate-900 rounded-2xl border-2 border-indigo-500 shadow-2xl flex items-center justify-center text-white ring-4 ring-indigo-500/20">
           <Camera size={20} className="animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ExamRoom;
