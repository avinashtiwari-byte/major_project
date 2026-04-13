import React from 'react';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  
  // Hide navbar during actual exams to prevent distractions
  const isExamRoom = pathname.includes('/student/exam/') && !pathname.includes('/results');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {!isExamRoom && <Navbar />}
      <main className={!isExamRoom ? "pt-6" : ""}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
