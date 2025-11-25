'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/home/section-header';
import { FooterSection } from '@/components/home/sections/footer-section';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Check, 
  Star,
  Zap,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  Brain,
  Rocket,
  Globe,
  Code,
  Target,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/home';

// Hero Section Component
const AboutHeroSection = () => {
  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="relative z-10 pt-32 mx-auto h-full w-full max-w-6xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6 pt-12 max-w-4xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-pink-500">Meet Machine</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tighter text-balance text-center">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">The AI that works</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">for you, not with you.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-3xl">
              Machine is a generalist AI agent that acts autonomously on your behalf. Unlike traditional AI assistants that require constant guidance, Machine takes initiative and gets things done.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg">
                  Try Machine Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="px-8 py-3 rounded-full border-pink-500/30 text-pink-500 hover:bg-pink-500/10">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// What is Machine Section
const WhatIsMachineSection = () => {
  return (
    <section className="w-full py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What is Machine?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Machine represents the next evolution in AI technology—an autonomous agent that doesn't just respond to commands, but actively works to achieve your goals.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">Beyond Traditional AI</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Autonomous Action</h4>
                  <p className="text-muted-foreground text-sm">Machine doesn't wait for instructions. It proactively identifies tasks and executes them independently.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Context Awareness</h4>
                  <p className="text-muted-foreground text-sm">Understands your business, preferences, and goals to make intelligent decisions on your behalf.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Continuous Learning</h4>
                  <p className="text-muted-foreground text-sm">Adapts and improves based on your feedback and changing requirements.</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl p-8 border border-pink-500/20"
          >
            <div className="text-center">
              <Brain className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-4">Generalist Intelligence</h3>
              <p className="text-muted-foreground">
                Unlike specialized AI tools, Machine is designed to handle any task across any domain. From research and analysis to content creation and automation, Machine adapts to your needs.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// How Machine Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Understand Your Goals",
      description: "Machine analyzes your objectives, context, and preferences to understand what you're trying to achieve."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Plan & Strategize",
      description: "Creates comprehensive action plans, breaking down complex tasks into manageable steps."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Execute Autonomously",
      description: "Takes action across multiple tools and platforms without requiring constant supervision."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Learn & Improve",
      description: "Continuously refines its approach based on results and your feedback for better performance."
    }
  ];

  return (
    <section className="w-full py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Machine Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Machine operates on a simple but powerful principle: autonomous intelligence that acts on your behalf.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                {step.icon}
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-sm font-bold">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Why Machine Section
const WhyMachineSection = () => {
  const benefits = [
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Increased Productivity",
      description: "Automate routine tasks and focus on high-value work while Machine handles the rest."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "24/7 Availability",
      description: "Machine works around the clock, ensuring your projects progress even when you're offline."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Reliable & Secure",
      description: "Built with enterprise-grade security and reliability standards you can trust."
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Open Source",
      description: "Fully transparent, customizable, and backed by a thriving developer community."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Scalable Teams",
      description: "Deploy multiple AI agents to handle different aspects of your business operations."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Human-Centric",
      description: "Designed to augment human capabilities, not replace them. You stay in control."
    }
  ];

  return (
    <section className="w-full py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Machine?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Machine isn't just another AI tool—it's a paradigm shift in how we work with artificial intelligence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-4 text-pink-500">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section Component
const CTASection = () => {
  return (
    <section className="w-full py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-12 border border-pink-500/20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to experience the future of AI?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already transformed their workflows with Machine's autonomous intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="px-8 py-3 rounded-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Main About Page Component
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <AboutHeroSection />
      <WhatIsMachineSection />
      <HowItWorksSection />
      <WhyMachineSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
