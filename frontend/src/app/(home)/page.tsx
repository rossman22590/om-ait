"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Zap, BookOpen, Users, MessageCircle, Award, Globe, Code, Brain, Shield } from "lucide-react";
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

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen w-full overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-36 relative overflow-hidden mt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent z-0"></div>
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0">
            {Array.from({ length: 200 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: Math.random() * 0.7 }}
                transition={{ 
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: Math.random() * 5
                }}
                className="absolute bg-primary/20 dark:bg-primary/30 rounded-full"
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 6 + 1}px`,
                  height: `${Math.random() * 6 + 1}px`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 rounded-full shadow-xl dark:shadow-gray-800/30 mb-6"
            >
              <Zap size={18} className="text-primary" />
              <span className="text-sm font-medium">World's First Autonomous AI Agent</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight"
            >
              AI Tutor Machine
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
            >
              The world's first fully autonomous AI agent that completes complex tasks without supervision
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-5 mt-10 w-full justify-center"
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 py-7 text-lg shadow-xl shadow-primary/25 transition-all duration-300 hover:scale-105 font-medium">
                <Link href="/auth/login" className="flex items-center gap-2">Get Started <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-10 py-7 text-lg border-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium">
                <Link href="#features" className="flex items-center gap-2">Learn More <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 relative w-full max-w-4xl mx-auto"
            >
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/50 to-secondary/50 opacity-50 blur-xl rounded-2xl"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="ml-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Zap size={14} className="text-primary mr-1.5" /> 
                    <span>AI Tutor Machine | Autonomous Agent</span>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 0 && (
                      <motion.div 
                        key="tab-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-none p-4 text-gray-700 dark:text-gray-300 text-sm">
                            <p>Research quantum computing developments in the last 5 years and prepare a summary with key breakthroughs.</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                            <Zap size={16} className="text-primary" />
                          </div>
                          <div className="bg-primary/10 rounded-2xl rounded-tl-none p-4 text-gray-700 dark:text-gray-300 text-sm">
                            <p className="font-medium mb-2">✓ Task Accepted</p>
                            <p>I'll research quantum computing breakthroughs from the past 5 years and prepare a comprehensive summary for you. This will include:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              <li>Major hardware advancements</li>
                              <li>Algorithm developments</li>
                              <li>Commercial applications</li>
                              <li>Academic research highlights</li>
                            </ul>
                            <p className="mt-2">Starting research now, I'll update you on my progress...</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {activeTab === 1 && (
                      <motion.div 
                        key="tab-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                            <Zap size={16} className="text-primary" />
                          </div>
                          <div className="bg-primary/10 rounded-2xl rounded-tl-none p-4 text-gray-700 dark:text-gray-300 text-sm">
                            <p className="font-medium mb-2">🔍 Research Progress: 67%</p>
                            <p>I've gathered information from 14 scientific papers, 3 industry reports, and Google's quantum computing blog. Key findings so far:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              <li>Google's quantum supremacy claim (2019)</li>
                              <li>IBM's 127-qubit Eagle processor (2021)</li>
                              <li>Error correction advancements</li>
                            </ul>
                            <p className="mt-2">Continuing to analyze sources and compile the summary...</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {activeTab === 2 && (
                      <motion.div 
                        key="tab-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                            <Zap size={16} className="text-primary" />
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl rounded-tl-none p-4 text-gray-700 dark:text-gray-300 text-sm">
                            <p className="font-medium text-green-700 dark:text-green-400 mb-2">✅ Task Completed</p>
                            <p>I've completed the research and prepared a comprehensive 12-page report on quantum computing breakthroughs in the last 5 years.</p>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mt-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                Quantum_Computing_Report.pdf (1.2 MB)
                              </div>
                            </div>
                            <p className="mt-3">Would you like me to explain any specific section in more detail?</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="w-full py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10 dark:via-transparent dark:to-transparent z-0"></div>
        
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">Autonomous Intelligence</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Discover how our advanced AI agent works independently to complete complex tasks while you focus on what matters.</p>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-xl transition-all duration-300 h-full bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <div className="mb-4 p-3 w-fit rounded-xl bg-primary/10">{feature.icon}</div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="w-full py-24 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">What Our Users Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Real people sharing their experiences with AI Tutor Machine.</p>
          </div>
          
          <Script src="https://widget.senja.io/widget/698903f7-82e1-43c9-a1e4-507b33742e0a/platform.js" strategy="afterInteractive" />
          <div className="senja-embed" data-id="698903f7-82e1-43c9-a1e4-507b33742e0a" data-mode="shadow" data-lazyload="false" style={{ display: "block", width: "100%" }}></div>
        </div>
      </section>
      
      {/* Use Cases Section */}
      <section className="w-full py-24 bg-gray-50 dark:bg-gray-900/50">
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
                icon: <BookOpen className="h-6 w-6 text-white" />,
                title: "Trip to Japan in april",
                description: "AI Tutor integrates comprehensive travel information to create personalized itineraries and produces a custom travel handbook tailored specifically for your Japanese adventure.",
                image: "/images/examples/japan-trip.jpg",
                time: "10-min",
                workflow: "Research"
              },
              {
                icon: <Code className="h-6 w-6 text-white" />,
                title: "Deeply analyze Tesla stocks",
                description: "AI Tutor delivers in-depth stock analysis with visually compelling dashboards that showcase comprehensive insights into Tesla's market performance and financial outlook.",
                image: "/images/examples/tesla-analysis.jpg",
                time: "12-min",
                workflow: "Analysis"
              },
              {
                icon: <Globe className="h-6 w-6 text-white" />,
                title: "Interactive course on the momentum theorem",
                description: "AI Tutor develops engaging video presentations for middle school educators, clearly explaining the momentum theorem through accessible and educational content.",
                image: "/images/examples/momentum-course.jpg",
                time: "8-min",
                workflow: "Education"
              },
              {
                icon: <Shield className="h-6 w-6 text-white" />,
                title: "Comparative analysis of insurance policies",
                description: "Looking to compare insurance options? AI Tutor generates clear, structured comparison tables highlighting key policy information with optimal recommendations.",
                image: "/images/examples/insurance-compare.jpg",
                time: "6-min",
                workflow: "Comparison"
              },
              {
                icon: <Users className="h-6 w-6 text-white" />,
                title: "B2B supplier sourcing",
                description: "AI Tutor conducts comprehensive research across extensive networks to identify the most suitable suppliers for your specific requirements. As your dedicated agent, AI Tutor works exclusively in your interest.",
                image: "/images/examples/supplier-sourcing.jpg",
                time: "14-min",
                workflow: "Research"
              },
              {
                icon: <MessageCircle className="h-6 w-6 text-white" />,
                title: "Research on AI products for the clothing industry",
                description: "AI Tutor conducted in-depth research on AI search products in the clothing industry with comprehensive product analysis and competitive positioning.",
                image: "/images/examples/clothing-ai.jpg",
                time: "9-min",
                workflow: "Market"
              },
              {
                icon: <Zap className="h-6 w-6 text-white" />,
                title: "List of YC companies",
                description: "AI Tutor expertly navigated the YC W25 database to identify all qualifying 528 companies, meticulously compiling this valuable information into a structured table.",
                image: "/images/examples/yc-companies.jpg",
                time: "13-min",
                workflow: "Data"
              },
              {
                icon: <Award className="h-6 w-6 text-white" />,
                title: "Online store operation analysis",
                description: "Upload your Amazon store sales data and AI Tutor delivers actionable insights, detailed visualizations, and customized strategies designed to increase your sales performance.",
                image: "/images/examples/store-analysis.jpg",
                time: "8-min",
                workflow: "Business"
              }
            ].map((example, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mb-4">
                    {example.icon}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{example.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm h-[80px] overflow-hidden">{example.description}</p>
                </div>
                <div className="h-[120px] bg-gray-100 dark:bg-gray-700 w-full relative flex items-center justify-center">
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-full font-medium">
                      Try for free • {example.time} task
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center space-x-1">
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
                    <div className="text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full">{example.workflow}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="w-full py-24 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary dark:from-white dark:to-primary-foreground">Flexible Pricing Plans</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Choose the right plan for your autonomous agent needs with transparent, usage-based pricing.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Free",
                price: "$0",
                period: "forever",
                description: "For exploration and personal use",
                features: [
                  "50 minutes per month",
                  "Basic autonomous actions",
                  "Text-based inputs & outputs",
                  "Core tools access",
                  "Community support"
                ],
                buttonText: "Get Started Free",
                popular: false
              },
              {
                title: "Pro",
                price: "$20",
                period: "per month",
                description: "For professionals and power users",
                features: [
                  "300 minutes per month",
                  "Advanced autonomous capabilities",
                  "Priority processing",
                  "Full tools access",
                  "Progress monitoring",
                  "Email support"
                ],
                buttonText: "Upgrade to Pro",
                popular: true
              },
              {
                title: "Enterprise",
                price: "$100",
                period: "per month",
                description: "For organizations and teams",
                features: [
                  "2400 minutes per month",
                  "Maximum autonomous capabilities",
                  "Custom integrations",
                  "Advanced analytics",
                  "API access",
                  "Dedicated support"
                ],
                buttonText: "Contact Sales",
                popular: false
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex"
              >
                <Card 
                  className={`border rounded-2xl overflow-hidden relative flex flex-col h-full w-full ${
                    plan.popular ? 
                    "border-primary shadow-xl shadow-primary/20 dark:shadow-primary/10" : 
                    "border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.title}</CardTitle>
                    <div className="flex justify-center items-baseline mt-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1.5">/{plan.period}</span>
                    </div>
                    <CardDescription className="mt-3 text-base">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex-grow">
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="mt-1 bg-primary/10 p-1 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className={`w-full py-6 text-lg font-medium ${
                        plan.popular ? 
                        "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" : 
                        "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            All plans include access to our core autonomous agent capabilities. <Link href="#" className="text-primary hover:underline">See all plan details</Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-24 bg-gradient-to-br from-primary/15 via-primary/5 to-white dark:from-primary/30 dark:via-primary/15 dark:to-transparent">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">Experience the Power of Autonomous AI</h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Join forward-thinking professionals who are revolutionizing their workflow with AI Tutor Machine's autonomous capabilities.
            </p>
            <div className="pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-7 rounded-xl text-xl shadow-xl shadow-primary/20 font-medium hover:translate-y-[-2px] transition-all duration-300">
                <Link href="/auth/login" className="flex items-center gap-2">
                  Get Started Now <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-16 bg-gray-100 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-700">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <Zap className="h-7 w-7 text-primary mr-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">AI Tutor Machine</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-lg">
                The autonomous general-purpose AI agent that completes complex tasks without supervision.
              </p>
              <div className="flex space-x-5">
                <Link href="#" className="text-gray-500 hover:text-primary transition-colors">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-primary transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-primary transition-colors">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                  </svg>
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-5">Product</h3>
              <ul className="space-y-4">
                <li><Link href="#features" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Use Cases</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-5">Company</h3>
              <ul className="space-y-4">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400"> 2025 AI Tutor Machine. All rights reserved.</p>
            <div className="flex space-x-8 mt-6 md:mt-0">
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}