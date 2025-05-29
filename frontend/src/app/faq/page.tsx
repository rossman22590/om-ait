"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Info, Brain, Zap, Shield, Headphones, Search, Clock } from "lucide-react";
import { Navbar } from "@/components/home/sections/navbar";
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";

export default function FAQPage() {
  // FAQ categories with their questions and answers
  const faqCategories = [
    {
      category: "General",
      icon: <Info className="h-6 w-6 text-pink-500" />,
      questions: [
        {
          question: "What is Machine?",
          answer: "Machine is the world's first fully autonomous AI agent capable of completing complex tasks without supervision. Our technology combines advanced language models with proprietary autonomous reasoning architecture, allowing the agent to plan, research, and execute multi-step tasks while adapting to your specific needs and preferences over time."
        },
        {
          question: "How is Machine different from other AI assistants?",
          answer: "Unlike conventional AI assistants that require continuous guidance, Machine works autonomously to complete entire workflows. It can switch between tasks, use multiple tools, access information online, and maintain context over long periods. Machine also has a persistent memory system that builds knowledge about your preferences over time, making it increasingly personalized to your needs."
        },
        {
          question: "What can I use Machine for?",
          answer: "Machine can handle a wide range of tasks, including research, content creation, data analysis, coding and development, customer support, marketing assistance, administrative tasks, and more. Its autonomous nature makes it particularly valuable for complex, multi-step processes that would typically require significant time and attention."
        }
      ]
    },
    {
      category: "Technology",
      icon: <Brain className="h-6 w-6 text-pink-500" />,
      questions: [
        {
          question: "How does Machine's technology work?",
          answer: "Machine combines state-of-the-art language models with our proprietary autonomous reasoning system. This architecture enables planning, critical thinking, tool use, and contextual memory. The system can break down complex requests into manageable steps, adapt to changing requirements, and learn from previous interactions to improve performance over time."
        },
        {
          question: "Is Machine trained on my data?",
          answer: "No, Machine does not use your data for training its underlying models. While your interactions with Machine are stored to provide continuity and personalization, this information is private to your account and not used to train the core AI systems used by others."
        },
        {
          question: "Can Machine access the internet?",
          answer: "Yes, Machine can access the internet to retrieve up-to-date information, research topics, and use web-based tools when necessary to complete your tasks. This capability allows it to work with current data rather than being limited to information available during its training period."
        }
      ]
    },
    {
      category: "Usage",
      icon: <Zap className="h-6 w-6 text-pink-500" />,
      questions: [
        {
          question: "How do I get started with Machine?",
          answer: "Getting started with Machine is simple. Sign up for an account, choose a plan that fits your needs, and you'll immediately gain access to your personal AI agent. You can start assigning tasks right away through our intuitive interface, and the onboarding process includes guidance on how to effectively communicate your requirements."
        },
        {
          question: "How long does it take for Machine to complete tasks?",
          answer: "Completion time varies depending on the complexity of the task. Simple requests may be fulfilled within minutes, while more complex projects requiring research or multiple steps might take longer. Machine works asynchronously, so you can assign tasks and return later to review the results, with the option to receive notifications when your tasks are complete."
        },
        {
          question: "Can I use Machine on mobile devices?",
          answer: "Yes, Machine is fully accessible via our responsive web application that works on smartphones and tablets. We also offer dedicated mobile apps for iOS and Android, providing the same functionality with an interface optimized for mobile use."
        }
      ]
    },
    {
      category: "Support",
      icon: <Headphones className="h-6 w-6 text-pink-500" />,
      questions: [
        {
          question: "How can I get help if I have issues?",
          answer: "We offer multiple support channels depending on your plan. All users have access to our comprehensive knowledge base and community forums. Pro users receive email support with a 24-hour response time, while Enterprise users enjoy priority support with dedicated account managers and phone support options."
        },
        {
          question: "Do you offer onboarding assistance?",
          answer: "Yes, we provide onboarding assistance for all users. Free users have access to self-service resources including tutorials and documentation. Pro and Enterprise users receive personalized onboarding sessions to help them get the most out of Machine for their specific use cases."
        },
        {
          question: "How do I report a bug or suggest a feature?",
          answer: "You can report bugs or suggest features through our feedback portal accessible from your dashboard. We actively monitor these reports and prioritize them based on impact and feasibility. Enterprise users can work directly with their account managers to fast-track critical issues or feature requests."
        }
      ]
    },
    {
      category: "Privacy & Security",
      icon: <Shield className="h-6 w-6 text-pink-500" />,
      questions: [
        {
          question: "How does Machine handle my data?",
          answer: "Machine treats your data with the utmost care and confidentiality. All data is encrypted both in transit and at rest. Your conversations, documents, and other information are used only to provide the service to you and are not shared with third parties without your explicit consent."
        },
        {
          question: "Can I delete my data?",
          answer: "Yes, you have complete control over your data. You can delete individual conversations, specific files, or your entire account at any time through your account settings. When you delete data, it is permanently removed from our active systems, though it may remain in encrypted backups for a limited time as required by law."
        },
        {
          question: "Is Machine compliant with privacy regulations?",
          answer: "Yes, Machine is designed to comply with major privacy regulations including GDPR, CCPA, and other applicable data protection laws. We regularly review and update our practices to ensure ongoing compliance as regulations evolve."
        }
      ]
    },
    {
      category: "Limitations",
      icon: <Shield className="h-6 w-6 text-pink-500" />,
      questions: [
        {
          question: "What can Machine do?",
          answer: "Machine excels at a wide range of tasks requiring reasoning and analysis, including: researching topics and summarizing information, writing and editing content, answering knowledge-based questions, performing data analysis, writing code and debugging technical issues, generating creative content, planning and organizing information, handling repetitive workflows, and generally completing tasks that require thinking but don't need physical interaction with the world."
        },
        {
          question: "What can't Machine do?",
          answer: "Machine has important limitations you should be aware of: it cannot perform physical tasks in the real world, cannot make phone calls or send text messages, has no ability to access private systems without explicit authorized connections, cannot manually control hardware or IoT devices, has limited real-time data access (knowledge cutoff applies), cannot perform tasks requiring human judgment in high-stakes scenarios (legal, medical, financial decisions), and may occasionally make reasoning errors, especially with complex calculations or logic."
        },
        {
          question: "How accurate is Machine?",
          answer: "Machine strives for high accuracy but is not infallible. While it excels at tasks involving language understanding, research, and content creation, it may occasionally make mistakes, especially with complex numerical calculations, niche domain knowledge, or rapidly changing information. Always verify critical information, particularly for professional, legal, or health-related matters."
        },
        {
          question: "Are there usage restrictions?",
          answer: "Yes, Machine cannot be used for generating harmful content, engaging in illegal activities, creating deliberately misleading information, generating discriminatory content, or automating mass harassment or spam. Our systems monitor for misuse, and accounts found violating our terms of service may be restricted or terminated."
        },
        {
          question: "Will Machine continue to improve?",
          answer: "Absolutely! We're constantly updating Machine with new capabilities, improved reasoning, expanded tool access, and better performance. Our development roadmap includes enhanced autonomous capabilities, more specialized domain knowledge, and improved accuracy in complex reasoning tasks."
        }
      ]
    }
  ];

  // Combine all questions into a single array without categories
  const allQuestions = faqCategories.flatMap(category => 
    category.questions.map(q => ({...q, category: category.category, icon: category.icon}))
  );

  // Render FAQ category
  const renderFaqCategory = (category, index) => (
    <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mr-4">
          {category.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.category}</h3>
      </div>
      <ul className="space-y-3">
        {category.questions.map((faq, faqIndex) => (
          <li key={faqIndex} className="flex items-start">
            <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
            <span>{faq.question}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      {/* Hero section */}
      <section className="w-full py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute w-full h-full">
            <FlickeringGrid
              squareSize={2.2}
              gridGap={20}
              color="var(--primary)"
              maxOpacity={0.2}
              flickerChance={0.04}
            />
          </div>
        </div>
        
        <div className="container px-4 md:px-6 mx-auto relative z-10 max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <div className="inline-block rounded-full bg-pink-100 dark:bg-pink-900/30 px-3 py-1 text-sm text-pink-600 dark:text-pink-300 mb-4">
              Find Answers
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-pink-500 dark:from-white dark:to-pink-400">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              Everything you need to know about Machine, the autonomous AI agent that completes complex tasks without supervision.
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
          </div>
        </div>
      </section>
      
      {/* Search (placeholder for future implementation) */}
      <section className="w-full py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Have a question? Search our FAQ..." 
                className="w-full py-4 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-600"
                disabled
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations Section */}
      <section className="w-full py-16 bg-gray-50 dark:bg-gray-800/20">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What Machine Can & Cannot Do</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-8"></div>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
              Understanding Machine's capabilities and limitations helps you get the most out of our autonomous AI agent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Machine Can</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
                  <span>Research topics and summarize information</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
                  <span>Write and edit content</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
                  <span>Write code and debug technical issues</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
                  <span>Perform data analysis</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
                  <span>Generate creative content</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-green-500 mr-2 mt-0.5">✓</div>
                  <span>Handle complex multi-step workflows</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Machine Cannot</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 text-red-500 mr-2 mt-0.5">✗</div>
                  <span>Perform physical tasks in the real world</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-red-500 mr-2 mt-0.5">✗</div>
                  <span>Make phone calls or send text messages</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-red-500 mr-2 mt-0.5">✗</div>
                  <span>Access private systems without authorization</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-red-500 mr-2 mt-0.5">✗</div>
                  <span>Control hardware or IoT devices</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-red-500 mr-2 mt-0.5">✗</div>
                  <span>Provide legal, medical, or financial advice</span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 text-red-500 mr-2 mt-0.5">✗</div>
                  <span>Access very recent information (knowledge cutoff applies)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main FAQ section */}
      <section className="w-full py-16 bg-white dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {allQuestions.map((faq, faqIndex) => (
                <AccordionItem key={faqIndex} value={`faq-${faqIndex}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 text-left font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="w-full py-16 bg-black border-t border-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to experience the future?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users already benefiting from Machine's autonomous AI capabilities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="gap-2 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-medium">
                <Link href="/auth">
                  <span>Get Started</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                <Link href="/pricing">
                  <span>View Pricing</span>
                </Link>
              </Button>
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
              <Link href="/legal" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Legal
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
