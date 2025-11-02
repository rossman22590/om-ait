'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Check, Zap } from 'lucide-react';

export function InteractiveDemo() {
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

  const prefersReducedMotion = useReducedMotion();
  
  // 3D tilt effects
  const cardRotX = useMotionValue(0);
  const cardRotY = useMotionValue(0);
  const cardRotXSpring = useSpring(cardRotX, { stiffness: 120, damping: 14 });
  const cardRotYSpring = useSpring(cardRotY, { stiffness: 120, damping: 14 });
  const cardGlow = useTransform([cardRotXSpring, cardRotYSpring], ([rx, ry]) => {
    const intensity = Math.min(1, (Math.abs(Number(rx)) + Math.abs(Number(ry))) / 30);
    return `0 0 ${12 + intensity * 24}px rgba(236,72,153,${0.25 + intensity * 0.25})`;
  });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const rotY = ((relX / rect.width) - 0.5) * 16;
    const rotX = -((relY / rect.height) - 0.5) * 10;
    cardRotX.set(rotX);
    cardRotY.set(rotY);
  };

  const handleCardMouseLeave = () => {
    cardRotX.set(0);
    cardRotY.set(0);
  };

  useEffect(() => {
    // Reset states
    setAgentProgress(0);
    setSearchingDatabases(false);
    setFoundPapers(false);
    setReviewingIndustry(false);
    setGeneratingDocument(false);
    setDocumentProgress(0);
    setDocumentSections({ executive: false, hardware: false, algorithm: false, commercial: false });
    setFilesGenerated({ chart: false, data: false });

    const timeline = [
      { time: 500, action: () => setSearchingDatabases(true) },
      { time: 1200, action: () => setFoundPapers(true) },
      { time: 1800, action: () => setReviewingIndustry(true) },
      { time: 2400, action: () => setGeneratingDocument(true) },
      { time: 2800, action: () => {
        setDocumentSections(prev => ({ ...prev, executive: true }));
        setDocumentProgress(20);
      }},
      { time: 3400, action: () => {
        setDocumentSections(prev => ({ ...prev, hardware: true }));
        setDocumentProgress(45);
      }},
      { time: 3800, action: () => setFilesGenerated(prev => ({ ...prev, chart: true }))},
      { time: 4600, action: () => {
        setDocumentSections(prev => ({ ...prev, algorithm: true }));
        setDocumentProgress(75);
      }},
      { time: 5400, action: () => {
        setDocumentSections(prev => ({ ...prev, commercial: true }));
        setDocumentProgress(100);
        setFilesGenerated(prev => ({ ...prev, data: true }));
      }}
    ];

    const timers = timeline.map(({ time, action }) => setTimeout(action, time));
    const progressInterval = setInterval(() => {
      setAgentProgress(prev => {
        if (prev < 100) return prev + 2;
        clearInterval(progressInterval);
        return 100;
      });
    }, 80);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <section className="flex flex-col items-center justify-center w-full relative py-24 md:py-32">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <div className="px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center mb-4">
                Watch Machine Work
              </h2>
              <p className="text-muted-foreground text-center font-medium">
                See how Machine autonomously completes complex research tasks in real-time
              </p>
            </div>

            <motion.div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                rotateX: cardRotXSpring,
                rotateY: cardRotYSpring,
                boxShadow: cardGlow,
                transformStyle: "preserve-3d",
                willChange: "transform, box-shadow"
              }}
              className="relative bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-3 text-sm flex items-center">
                  <Zap size={14} className="text-secondary mr-1.5" />
                  <span>Machine</span>
                  <span className="mx-1 text-muted-foreground">|</span>
                  <span className="text-secondary font-medium">Autonomous Agent</span>
                </div>
                <div className="ml-auto text-xs flex items-center">
                  <span className="mr-2 bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full flex items-center">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    Active
                  </span>
                  {agentProgress > 0 && (
                    <span className="text-xs text-muted-foreground">{agentProgress}%</span>
                  )}
                </div>
              </div>

              <div className="p-6 text-sm font-mono">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left side - Chat */}
                  <div className="w-full md:w-1/2 space-y-6">
                    {/* User input */}
                    <div className="flex items-start">
                      <div className="bg-muted rounded-lg p-3 shadow-sm">
                        Research quantum computing developments in the last 5 years and prepare a summary with key breakthroughs.
                      </div>
                    </div>

                    {/* Agent response */}
                    <div className="pl-4 border-l-2 border-secondary ml-2">
                      <div className="flex items-center mb-2 text-secondary">
                        <Zap size={14} className="mr-2" />
                        <span className="font-semibold">Task Accepted</span>
                      </div>
                      <p className="text-foreground mb-3">
                        I'll research quantum computing breakthroughs from the past 5 years and prepare a comprehensive summary for you.
                      </p>
                    </div>

                    {/* Agent activity indicators */}
                    <AnimatePresence>
                      {searchingDatabases && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 pl-4 border-l-2 border-pink-500 ml-2"
                        >
                          <div className="flex items-center text-pink-500">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-semibold">Searching academic databases...</span>
                          </div>
                        </motion.div>
                      )}

                      {foundPapers && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 pl-4 border-l-2 border-green-500 ml-2"
                        >
                          <div className="flex items-center text-green-500">
                            <Check size={14} className="mr-2" />
                            <span className="font-semibold">Found 38 relevant papers</span>
                          </div>
                        </motion.div>
                      )}

                      {reviewingIndustry && (
                        <motion.div
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
                        </motion.div>
                      )}

                      {generatingDocument && (
                        <motion.div
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right side - Document generation */}
                  <div className="w-full md:w-1/2 bg-muted/30 p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="font-medium">Quantum_Report.pdf</span>
                      </div>
                      <div className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full flex items-center">
                        {documentProgress < 100 ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full mr-1 animate-pulse"></span>
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

                    <div className="bg-card p-3 rounded-md border border-border">
                      <div className="border-b border-border pb-2 mb-2">
                        <h3 className="font-bold">Quantum Computing: 5-Year Analysis</h3>
                        <p className="text-xs text-muted-foreground">Research Report | 2025</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-medium flex items-center">
                            1. Executive Summary
                            {documentSections.executive && <Check size={10} className="text-green-500 ml-1" />}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium flex items-center">
                            2. Hardware Advances
                            {documentSections.hardware && <Check size={10} className="text-green-500 ml-1" />}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium flex items-center">
                            3. Algorithm Developments
                            {documentSections.algorithm && <Check size={10} className="text-green-500 ml-1" />}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium flex items-center">
                            4. Commercial Applications
                            {documentSections.commercial && <Check size={10} className="text-green-500 ml-1" />}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="w-full bg-border h-1.5 rounded-full">
                        <motion.div
                          className="bg-secondary h-1.5 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${documentProgress}%` }}
                          transition={{ duration: 0.5 }}
                        ></motion.div>
                      </div>
                      <span className="ml-2 text-xs text-muted-foreground">{documentProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
