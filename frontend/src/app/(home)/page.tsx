"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Check, Zap, BookOpen, Users, MessageCircle, Award, Globe, Code, Brain, Shield, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import Script from "next/script";
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(true);
  
  // Demo animation states
  const [agentProgress, setAgentProgress] = useState(0);
  const [searchingDatabases, setSearchingDatabases] = useState(false);
  const [foundPapers, setFoundPapers] = useState(false);
  const [reviewingIndustry, setReviewingIndustry] = useState(false);
  const [generatingDocument, setGeneratingDocument] = useState(false);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [documentSections, setDocumentSections] = useState({
    executive: false,
    hardware: false,
    algorithm: false,
    commercial: false
  });
  const [filesGenerated, setFilesGenerated] = useState({
    chart: false,
    data: false
  });
  
  // Simulate agent working through the process
  useEffect(() => {
    // Reset states on first render
    setAgentProgress(0);
    setSearchingDatabases(false);
    setFoundPapers(false);
    setReviewingIndustry(false);
    setGeneratingDocument(false);
    setDocumentProgress(0);
    setDocumentSections({
      executive: false,
      hardware: false,
      algorithm: false,
      commercial: false
    });
    setFilesGenerated({
      chart: false,
      data: false
    });
    
    // Simulate agent workflow with delays
    const timeline = [
      // Task accepted - already showing
      { time: 1500, action: () => setSearchingDatabases(true) },
      { time: 4000, action: () => setFoundPapers(true) },
      { time: 5500, action: () => setReviewingIndustry(true) },
      { time: 7000, action: () => setGeneratingDocument(true) },
      { time: 8000, action: () => {
        setDocumentSections(prev => ({ ...prev, executive: true }));
        setDocumentProgress(15);
      }},
      { time: 10000, action: () => {
        setDocumentSections(prev => ({ ...prev, hardware: true }));
        setDocumentProgress(35);
      }},
      { time: 11000, action: () => setFilesGenerated(prev => ({ ...prev, chart: true }))},
      { time: 14000, action: () => {
        setDocumentSections(prev => ({ ...prev, algorithm: true }));
        setDocumentProgress(70);
      }},
      { time: 17000, action: () => {
        setDocumentSections(prev => ({ ...prev, commercial: true }));
        setDocumentProgress(100);
        setFilesGenerated(prev => ({ ...prev, data: true }));
      }}
    ];
    
    // Set up the timers
    const timers = timeline.map(({ time, action }) => 
      setTimeout(action, time)
    );
    
    // Increment progress smoothly
    const progressInterval = setInterval(() => {
      setAgentProgress(prev => {
        if (prev < 100) {
          return prev + 1;
        }
        clearInterval(progressInterval);
        return 100;
      });
    }, 200);
    
    // Clean up timers on unmount
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearInterval(progressInterval);
    };
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen w-full overflow-x-hidden bg-white dark:bg-black">
      {/* Registration Disabled Popup */}
      <AnimatePresence>
        {showRegistrationPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="relative p-6">
                <button 
                  onClick={() => setShowRegistrationPopup(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registration Notice</h3>
                </div>
                
                <div className="mb-6 space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Registration is currently disabled</span> and there is no free tier available, but if you're an existing subscriber you can still log in.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      If you have <span className="font-semibold text-pink-500">AI Tutor Premium</span> or higher, please reach out to:
                    </p>
                    <a 
                      href="mailto:rcohen@mytsi.org" 
                      className="text-pink-500 hover:text-pink-600 dark:hover:text-pink-400 font-medium block"
                    >
                      rcohen@mytsi.org
                    </a>
                  </div>
                  
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800/50">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-semibold">Machine is accepting new subscribers!</span> If you want to purchase a plan, click the button below or go to the pricing page.
                    </p>
                    <Link href="/pricing">
                      <Button 
                        className="w-full bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white mt-2"
                      >
                        View Pricing Plans
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Premium</span> subscribers receive the starter tier
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Ultra</span> subscribers receive the pro tier
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowRegistrationPopup(false)} 
                  className="w-full bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white"
                >
                  I understand
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <section id="hero" className="w-full py-24 md:py-32 relative overflow-x-hidden bg-white dark:bg-black" style={{ zIndex: 1 }}>
        {/* Sleek animated dots background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute w-full h-full">
            <FlickeringGrid
              squareSize={2.2}
              gridGap={20}
              color="var(--primary)"
              maxOpacity={0.3}
              flickerChance={0.04}
            />
          </div>
        </div>
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 rounded-full shadow-xl dark:shadow-gray-900/30 mb-6"
            >
              <Zap size={18} className="text-primary" />
              <span className="text-sm font-medium">Autonomous AI Agent</span>
            </motion.div>
            
            <motion.h1 
              className="font-bold text-center flex flex-col items-center mb-10 py-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <style jsx global>{`
                @keyframes gradientPulse {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
                
                .animated-gradient-text {
                  background: linear-gradient(90deg, #ff36f7, #ad5eff, #f14aff, #ff00c3);
                  background-size: 300% 100%;
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                  animation: gradientPulse 4s ease infinite;
                  text-shadow: none;
                  display: block;
                  letter-spacing: -1px;
                  line-height: 0.9;
                  margin-bottom: 15px;
                  font-size: 4.5rem;
                  font-weight: 800;
                  transform: translateZ(0);
                  backface-visibility: hidden;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                }
                
                .animated-gradient-text-sub {
                  background: linear-gradient(90deg, #ad5eff, #f14aff, #ff00c3, #ad5eff);
                  background-size: 300% 100%;
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                  animation: gradientPulse 4s ease infinite;
                  animation-delay: 0.5s;
                  display: block;
                  letter-spacing: -1px;
                  line-height: 1;
                  font-size: 3.75rem;
                  font-weight: 700;
                  text-shadow: none;
                  transform: translateZ(0);
                  backface-visibility: hidden;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                }
                
                @media (max-width: 768px) {
                  .animated-gradient-text {
                    font-size: 3rem;
                    margin-bottom: 10px;
                  }
                  
                  .animated-gradient-text-sub {
                    font-size: 2.5rem;
                  }
                }
              `}</style>
              <span className="animated-gradient-text">
                AI Tutor Machine
              </span> 
              <span className="animated-gradient-text-sub">Agentic Actions</span>  
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              The autonomous AI agent that completes complex tasks with zero human supervision
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-5 mt-10 w-full justify-center"
            >
              <Button size="lg" className="bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white dark:text-white rounded-full px-10 py-7 text-lg shadow-xl shadow-pink-500/25 dark:shadow-pink-600/50 transition-all duration-300 hover:scale-105 font-bold h-12 border-2 border-transparent dark:border-white/20">
                <Link href="/dashboard" className="flex items-center gap-2 text-white dark:text-white font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Get Started <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white dark:bg-gray-800 rounded-full px-10 py-7 text-lg border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 font-medium h-12">
                <Link href="#features" className="flex items-center gap-2">Learn More <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 relative w-full max-w-4xl mx-auto"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="ml-3 text-sm text-gray-500 dark:text-gray-300 flex items-center">
                    <Zap size={14} className="text-pink-500 mr-1.5" /> 
                    <span>AI Tutor Machine</span>
                    <span className="mx-1 dark:text-gray-400">|</span>
                    <span className="text-pink-500 font-medium">Autonomous Agent</span>
                  </div>
                  <div className="text-xs flex items-center">
                    <span className="mr-2 bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full flex items-center">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                      Active
                    </span>
                    {agentProgress > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{agentProgress}%</span>
                    )}
                  </div>
                </div>
                
                <div className="p-6 text-sm font-mono relative overflow-hidden">
                  <div className="flex flex-col md:flex-row space-x-0 md:space-x-4">
                    {/* Left side - Chat */}
                    <div className="w-full md:w-1/2 space-y-6 mb-6 md:mb-0">
                      {/* User input */}
                      <div className="flex items-start">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mr-4 text-gray-800 dark:text-gray-200 shadow-sm">
                          Research quantum computing developments in the last 5 years and prepare a summary with key breakthroughs.
                        </div>
                      </div>
                      
                      {/* Agent response */}
                      <div className="pl-4 border-l-2 border-pink-500 ml-2">
                        <div className="flex items-center mb-2 text-pink-500">
                          <Zap size={14} className="mr-2" />
                          <span className="font-semibold">Task Accepted</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          I'll research quantum computing breakthroughs from the past 5 years and prepare a comprehensive summary for you. This will include:
                        </p>
                        <ul className="space-y-1 mb-3 text-gray-700 dark:text-gray-300">
                          <li className="flex items-center">
                            <span className="mr-2">•</span>
                            <span>Major hardware advancements</span>
                          </li>
                          <li className="flex items-center">
                            <span className="mr-2">•</span>
                            <span>Algorithm developments</span>
                          </li>
                          <li className="flex items-center">
                            <span className="mr-2">•</span>
                            <span>Commercial applications</span>
                          </li>
                          <li className="flex items-center">
                            <span className="mr-2">•</span>
                            <span>Academic research highlights</span>
                          </li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300">Starting research now, I'll update you on my progress...</p>
                      </div>
                      
                      {/* Agent activity indicators */}
                      <AnimatePresence>
                        {searchingDatabases && (
                          <motion.div 
                            key="searching-databases"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 pl-4 border-l-2 border-blue-500 ml-2"
                          >
                            <div className="flex items-center text-blue-500">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="font-semibold">Searching academic databases...</span>
                            </div>
                            <div className="flex text-xs text-gray-500 dark:text-gray-400 ml-6 animate-pulse">
                              Accessing: Nature Quantum Information, arXiv preprints, Google Scholar...
                            </div>
                          </motion.div>
                        )}
                        
                        {foundPapers && (
                          <motion.div 
                            key="found-papers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 pl-4 border-l-2 border-green-500 ml-2"
                          >
                            <div className="flex items-center text-green-500">
                              <Check size={14} className="mr-2" />
                              <span className="font-semibold">Found 38 relevant papers</span>
                            </div>
                            <div className="flex text-xs text-gray-500 dark:text-gray-400 ml-6">
                              Analyzing quantum supremacy demonstrations, error correction advances...
                            </div>
                          </motion.div>
                        )}
                        
                        {reviewingIndustry && (
                          <motion.div 
                            key="reviewing-industry"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 pl-4 border-l-2 border-indigo-500 ml-2"
                          >
                            <div className="flex items-center text-indigo-500">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="font-semibold">Reviewing industry developments...</span>
                            </div>
                            <div className="flex text-xs text-gray-500 dark:text-gray-400 ml-6">
                              IBM Quantum, Google Quantum AI, D-Wave Systems, Rigetti...
                            </div>
                          </motion.div>
                        )}
                        
                        {generatingDocument && (
                          <motion.div 
                            key="generating-document"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 pl-4 border-l-2 border-orange-500 ml-2"
                          >
                            <div className="flex items-center text-orange-500">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="font-semibold">Generating comprehensive report...</span>
                            </div>
                            <div className="flex text-xs text-gray-500 dark:text-gray-400 ml-6">
                              Synthesizing research findings into clear sections and visualizations...
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Right side - Document generation */}
                    <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <span className="font-medium text-gray-800 dark:text-gray-200">Quantum_Computing_Report.pdf</span>
                        </div>
                        <div className="text-xs px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-full flex items-center">
                          {documentProgress < 100 ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1 animate-pulse"></span>
                              Generating
                            </>
                          ) : (
                            <>
                              <Check size={10} className="mr-1" />
                              Complete
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">Quantum Computing: 5-Year Analysis</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Comprehensive Research Report | April 2025</p>
                        </div>
                        
                        <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <div>
                            <p className="font-medium flex items-center">
                              1. Executive Summary 
                              {!documentSections.executive ? (
                                <svg className="animate-spin ml-1 h-2.5 w-2.5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <Check size={10} className="text-green-500 ml-1" />
                              )}
                            </p>
                            {documentSections.executive && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs ml-3"
                              >
                                The quantum computing landscape has evolved dramatically since 2020, with significant advancements in hardware capabilities, algorithms, and practical applications...
                              </motion.p>
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium flex items-center">
                              2. Hardware Advances 
                              {!documentSections.hardware ? (
                                documentSections.executive ? (
                                  <svg className="animate-spin ml-1 h-2.5 w-2.5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : null
                              ) : (
                                <Check size={10} className="text-green-500 ml-1" />
                              )}
                            </p>
                            {documentSections.hardware && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-3 text-xs"
                              >
                                <p>• IBM's roadmap achievement: 127-qubit (2021) → 433-qubit (2022) → 1,000+ (2023)</p>
                                <p>• Google's error-correction milestone: first logical qubit below error threshold</p>
                                <p>• IonQ's trapped-ion systems reaching 99.9% fidelity with 32 algorithmic qubits</p>
                              </motion.div>
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium flex items-center">
                              3. Algorithm Developments 
                              {!documentSections.algorithm ? (
                                documentSections.hardware ? (
                                  <svg className="animate-spin ml-1 h-2.5 w-2.5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : null
                              ) : (
                                <Check size={10} className="text-green-500 ml-1" />
                              )}
                            </p>
                            
                            {documentSections.algorithm ? (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-3 text-xs"
                              >
                                <p>• Quantum error correction improvements: Surface code implementation</p>
                                <p>• Variational quantum algorithms optimized for NISQ-era hardware</p>
                                <p>• Quantum machine learning libraries: TensorFlow Quantum, PennyLane</p>
                              </motion.div>
                            ) : (
                              documentSections.hardware && (
                                <div className="ml-3 text-xs border-l-2 border-pink-500 pl-2 py-1">
                                  <div className="animate-pulse">Writing content...</div>
                                </div>
                              )
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium flex items-center">
                              4. Commercial Applications
                              {!documentSections.commercial ? (
                                documentSections.algorithm ? (
                                  <svg className="animate-spin ml-1 h-2.5 w-2.5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : null
                              ) : (
                                <Check size={10} className="text-green-500 ml-1" />
                              )}
                            </p>
                            
                            {documentSections.commercial ? (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-3 text-xs"
                              >
                                <p>• Financial modeling: JPMorgan Chase, Goldman Sachs quantum risk analysis</p>
                                <p>• Material science: BMW, Volkswagen, and Daimler battery research</p>
                                <p>• Pharmaceutical: Merck, Biogen accelerated drug discovery</p>
                              </motion.div>
                            ) : (
                              documentSections.algorithm && (
                                <div className="ml-3 h-6 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                          <motion.div 
                            className="bg-pink-500 h-1.5 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${documentProgress}%` }}
                            transition={{ duration: 0.5 }}
                          ></motion.div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{documentProgress}%</span>
                      </div>
                      
                      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-2">Additional Files</div>
                        
                        <div className="space-y-2">
                          <AnimatePresence>
                            {filesGenerated.chart && (
                              <motion.div 
                                key="chart-file"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs"
                              >
                                <div className="flex items-center">
                                  <svg className="w-3.5 h-3.5 text-green-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  <span className="text-gray-700 dark:text-gray-300">Qubit_Growth_Chart.png</span>
                                </div>
                                <button className="text-xs px-2 py-0.5 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors">
                                  View
                                </button>
                              </motion.div>
                            )}
                            
                            {filesGenerated.data ? (
                              <motion.div 
                                key="data-file"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs"
                              >
                                <div className="flex items-center">
                                  <svg className="w-3.5 h-3.5 text-blue-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                  </svg>
                                  <span className="text-gray-700 dark:text-gray-300">Research_Data.xlsx</span>
                                </div>
                                <button className="text-xs px-2 py-0.5 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors">
                                  Download
                                </button>
                              </motion.div>
                            ) : (
                              generatingDocument && (
                                <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-md text-xs">
                                  <div className="flex items-center">
                                    <svg className="animate-spin w-3.5 h-3.5 text-blue-500 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-gray-600 dark:text-gray-400">Research_Data.xlsx</span>
                                  </div>
                                  <span className="text-xs text-gray-500">Preparing...</span>
                                </div>
                              )
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="w-full py-24 md:py-32 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">Autonomous Intelligence</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-3xl mx-auto">Discover how our advanced AI agent works independently to complete complex tasks while you focus on what matters.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                icon: <Brain className="h-8 w-8 text-primary" />,
                title: "Fully Autonomous",
                description: "Works independently without constant human supervision, making decisions and taking action to complete complex tasks."
              },
              {
                icon: <Code className="h-8 w-8 text-primary" />,
                title: "Advanced Reasoning",
                description: "Utilizes sophisticated AI models to understand context, plan multi-step tasks, and adapt to changing requirements."
              },
              {
                icon: <Globe className="h-8 w-8 text-primary" />,
                title: "Digital World Access",
                description: "Interacts with websites, searches information, analyzes data, and uses digital tools to accomplish goals."
              },
              {
                icon: <Shield className="h-8 w-8 text-primary" />,
                title: "Transparent Process",
                description: "Monitor progress in real-time with detailed updates and explanations of the agent's reasoning and actions."
              },
              {
                icon: <BookOpen className="h-8 w-8 text-primary" />,
                title: "Versatile Applications",
                description: "From detailed research to data analysis, code execution to content creation - handles diverse tasks across domains."
              },
              {
                icon: <MessageCircle className="h-8 w-8 text-primary" />,
                title: "Asynchronous Operation",
                description: "Set your task and return later - the agent works in the background, delivering results when you're ready."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full flex flex-col relative group cursor-pointer hover:shadow-md transition-shadow" style={{ position: 'relative', zIndex: 1 }}>
                <Link href="/auth" className="absolute inset-0 z-1">
                  <span className="sr-only">Try {feature.title}</span>
                </Link>
                <div className="p-6 flex-grow relative z-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="w-full py-24 md:py-32 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">What Our Users Say</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-3xl mx-auto">Join thousands of satisfied users already benefiting from our AI agent technology.</p>
          </div>
          
          <Script src="https://widget.senja.io/widget/698903f7-82e1-43c9-a1e4-507b33742e0a/platform.js" strategy="afterInteractive" />
          <div className="senja-embed" data-id="698903f7-82e1-43c9-a1e4-507b33742e0a" data-mode="shadow" data-lazyload="false" style={{ display: "block", width: "100%" }}></div>
        </div>
      </section>
      
      {/* Use Cases Section */}
      <section id="use-cases" className="w-full py-24 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="text-center mb-16">
            <div className="flex gap-2 justify-center mb-4">
              {['Featured', 'Research', 'Life', 'Data Analysis', 'Education', 'Productivity', 'WTF'].map((tag, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-full text-sm ${i === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {tag}
                </div>
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Real-World Examples</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <BookOpen className="h-6 w-6 text-pink-500" />,
                title: "Write product launch email series",
                description: "AI Tutor creates a strategic 5-email sequence for your product launch with compelling subject lines, engaging copy, and clear CTAs to maximize conversion.",
                image: "/images/examples/japan-trip.jpg",
                time: "9-min",
                workflow: "Marketing"
              },
              {
                icon: <Code className="h-6 w-6 text-pink-500" />,
                title: "Analyze website accessibility",
                description: "AI Tutor performs a comprehensive accessibility audit of your website, identifying WCAG compliance issues and providing actionable recommendations for improvement.",
                image: "/images/examples/tesla-analysis.jpg",
                time: "11-min",
                workflow: "Coding"
              },
              {
                icon: <Brain className="h-6 w-6 text-pink-500" />,
                title: "Create interactive lesson plan",
                description: "AI Tutor designs an engaging, standards-aligned lesson plan with interactive activities, discussion prompts, and assessment strategies for your specific grade level and subject.",
                image: "/images/examples/meeting-summary.jpg",
                time: "8-min",
                workflow: "Education"
              },
              {
                icon: <Shield className="h-6 w-6 text-pink-500" />,
                title: "Draft privacy policy document",
                description: "AI Tutor generates a comprehensive, legally-sound privacy policy tailored to your business type, location, and data collection practices to ensure regulatory compliance.",
                image: "/images/examples/job-email.jpg",
                time: "7-min",
                workflow: "Legal"
              },
              {
                icon: <Globe className="h-6 w-6 text-pink-500" />,
                title: "Research emerging market trends",
                description: "AI Tutor analyzes global market data to identify emerging trends, growth opportunities, and potential disruptions in your industry with actionable strategic recommendations.",
                image: "/images/examples/job-email.jpg",
                time: "12-min",
                workflow: "Business"
              },
              {
                icon: <Users className="h-6 w-6 text-pink-500" />,
                title: "Generate competitive analysis report",
                description: "AI Tutor creates a detailed competitive landscape analysis comparing your product against key competitors across features, pricing, market position, and customer sentiment.",
                image: "/images/examples/meeting-summary.jpg",
                time: "10-min",
                workflow: "Strategy"
              },
              {
                icon: <MessageCircle className="h-6 w-6 text-pink-500" />,
                title: "Create social media content calendar",
                description: "AI Tutor develops a month-long social media content plan with platform-specific post ideas, optimal posting times, hashtag strategies, and engagement tactics.",
                image: "/images/examples/tesla-analysis.jpg",
                time: "8-min",
                workflow: "Social"
              },
              {
                icon: <Award className="h-6 w-6 text-pink-500" />,
                title: "Design customer feedback survey",
                description: "AI Tutor crafts a comprehensive customer feedback survey with strategic questions to gather actionable insights on satisfaction, preferences, and improvement areas.",
                image: "/images/examples/japan-trip.jpg",
                time: "6-min",
                workflow: "Research"
              }
            ].map((example, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-[280px] flex flex-col relative group cursor-pointer hover:shadow-md transition-shadow" style={{ position: 'relative', zIndex: 1 }}>
                <Link href="/auth" className="absolute inset-0 z-1">
                  <span className="sr-only">Try {example.title}</span>
                </Link>
                <div className="p-6 flex-grow relative z-0">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    {example.icon}
                  </div>
                  <h3 className="text-lg font-medium">{example.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{example.description}</p>
                </div>
                <div className="h-[60px] bg-gray-100 dark:bg-gray-700 w-full relative flex items-center z-0">
                  <div className="absolute left-3">
                    <motion.div 
                      className="bg-black group-hover:bg-primary dark:bg-gray-800 dark:group-hover:bg-primary text-white text-xs px-4 py-1.5 rounded-full font-medium h-8 flex items-center justify-center w-[180px] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Try for free • {example.time}
                    </motion.div>
                  </div>
                  <div className="absolute right-3 flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      example.workflow === "Research" ? 
                      "bg-blue-400" :
                      example.workflow === "Analysis" ? "bg-green-400" :
                      example.workflow === "Education" ? "bg-purple-400" :
                      example.workflow === "Comparison" ? "bg-pink-400" :
                      example.workflow === "Market" ? "bg-amber-400" :
                      example.workflow === "Data" ? "bg-indigo-400" :
                      "bg-orange-400"
                    }`}></div>
                    <div className="text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full select-text">{example.workflow}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      

      
      {/* CTA Section */}
      <section id="cta" className="w-full py-24 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">Experience the Power of Autonomous AI</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Join forward-thinking professionals who are revolutionizing their workflow with AI Tutor Machine's autonomous capabilities.
            </p>
            <div className="pt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white dark:text-white h-12 px-8 relative overflow-hidden group border-2 border-transparent dark:border-white/20">
                  <motion.span
                    className="absolute inset-0 bg-white/20 rounded-lg"
                    initial={{ x: "-100%", opacity: 0 }}
                    whileHover={{ x: "100%", opacity: 0.4 }}
                    transition={{ duration: 0.6 }}
                  />
                  <Link href="/dashboard" className="flex items-center gap-2 relative z-10 text-white dark:text-white font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} Machine. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Home
              </Link>
              <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                About
              </Link>
              <Link href="/faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                FAQ
              </Link>
              <Link href="/#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Legal
              </Link>
              <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
// 'use client';

// import { useEffect, useState } from 'react';
// import { CTASection } from '@/components/home/sections/cta-section';
// // import { FAQSection } from "@/components/sections/faq-section";
// import { FooterSection } from '@/components/home/sections/footer-section';
// import { HeroSection } from '@/components/home/sections/hero-section';
// import { OpenSourceSection } from '@/components/home/sections/open-source-section';
// import { PricingSection } from '@/components/home/sections/pricing-section';
// import { UseCasesSection } from '@/components/home/sections/use-cases-section';

// export default function Home() {
//   return (
//     <main className="flex flex-col items-center justify-center min-h-screen w-full">
//       <div className="w-full divide-y divide-border">
//         <HeroSection />
//         <UseCasesSection />
//         {/* <CompanyShowcase /> */}
//         {/* <BentoSection /> */}
//         {/* <QuoteSection /> */}
//         {/* <FeatureSection /> */}
//         {/* <GrowthSection /> */}
//         <OpenSourceSection />
//         <PricingSection />
//         {/* <TestimonialSection /> */}
//         {/* <FAQSection /> */}
//         <CTASection />
//         <FooterSection />
//       </div>
//     </main>
//   );
// }

// 'use client';

// import { useEffect, useState } from 'react';
// import { CTASection } from '@/components/home/sections/cta-section';
// // import { FAQSection } from "@/components/sections/faq-section";
// import { FooterSection } from '@/components/home/sections/footer-section';
// import { HeroSection } from '@/components/home/sections/hero-section';
// import { OpenSourceSection } from '@/components/home/sections/open-source-section';
// import { PricingSection } from '@/components/home/sections/pricing-section';
// import { UseCasesSection } from '@/components/home/sections/use-cases-section';
// import { ModalProviders } from '@/providers/modal-providers';

// export default function Home() {
//   return (
//     <>
//       <ModalProviders />
//       <main className="flex flex-col items-center justify-center min-h-screen w-full">
//         <div className="w-full divide-y divide-border">
//           <HeroSection />
//           <UseCasesSection />
//           {/* <CompanyShowcase /> */}
//           {/* <BentoSection /> */}
//           {/* <QuoteSection /> */}
//           {/* <FeatureSection /> */}
//           {/* <GrowthSection /> */}
//           <OpenSourceSection />
//           <PricingSection />
//           {/* <TestimonialSection /> */}
//           {/* <FAQSection /> */}
//           <CTASection />
//           <FooterSection />
//         </div>
//       </main>
//     </>
//   );
// }
