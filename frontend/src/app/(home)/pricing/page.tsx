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
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/home';

// Hero Section Component
const PricingHeroSection = () => {
  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="relative z-10 pt-32 mx-auto h-full w-full max-w-6xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6 pt-12 max-w-4xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-pink-500">Simple, Transparent Pricing</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tighter text-balance text-center">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Scale your AI usage</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">as you grow.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-3xl">
              Start free and upgrade as your AI workforce grows. No hidden fees, no surprises—just powerful AI agents working for you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#pricing-plans">
                <Button variant="outline" size="lg" className="px-8 py-3 rounded-full border-pink-500/30 text-pink-500 hover:bg-pink-500/10">
                  View All Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Pricing Card Component
const PricingCard = ({ plan, isPopular = false }: { plan: any; isPopular?: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative p-8 rounded-2xl border ${
        isPopular 
          ? 'border-pink-500/30 bg-gradient-to-b from-pink-500/5 via-purple-500/5 to-transparent' 
          : 'border-border bg-card'
      } hover:shadow-lg transition-all duration-300`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg whitespace-nowrap">
            <Star className="w-3 h-3 flex-shrink-0" />
            Most Popular
          </div>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{plan.price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="text-muted-foreground mb-6">{plan.description}</p>
        
        <Link href="/auth">
          <Button 
            className={`w-full mb-6 ${
              isPopular 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200'
            }`}
          >
            {plan.buttonText}
          </Button>
        </Link>
        
        <div className="space-y-3 text-left">
          {plan.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI Token Credits",
      description: "Use your credits across all premium AI models including GPT-4, Claude, and more."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Custom AI Agents",
      description: "Create specialized agents tailored to your specific business needs and workflows."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Private & Secure",
      description: "Your data stays private with enterprise-grade security and compliance."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Advanced Capabilities",
      description: "Access to web browsing, file processing, integrations, and more."
    }
  ];

  return (
    <section className="w-full py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to build your AI workforce
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All plans include access to our full suite of AI capabilities and integrations.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ Section Component
const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  
  const faqs = [
    {
      question: "How do AI token credits work?",
      answer: "AI token credits are used when your agents interact with premium AI models. Different models consume different amounts of credits based on their capabilities. You can monitor your usage in real-time through your dashboard."
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
    },
    {
      question: "What happens if I exceed my credit limit?",
      answer: "If you approach your credit limit, we'll notify you. You can either upgrade your plan or purchase additional credits. Your agents will continue working without interruption."
    },
    {
      question: "Do you offer enterprise pricing?",
      answer: "Yes! We offer custom enterprise plans with dedicated support, custom integrations, and volume discounts. Contact our sales team for a personalized quote."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! All new users start with free credits to explore Machine's capabilities. No credit card required to get started."
    },
    {
      question: "What integrations are included?",
      answer: "All plans include access to 100+ integrations including popular tools like Slack, Google Workspace, Notion, Zapier, and many more. We're constantly adding new integrations."
    }
  ];

  return (
    <section className="w-full py-24 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Machine's pricing and features.
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border border-border rounded-lg bg-card"
            >
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground">{faq.question}</span>
                <ArrowRight 
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    openFAQ === index ? 'rotate-90' : ''
                  }`} 
                />
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
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
            Ready to build your AI workforce?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Machine to automate their workflows and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/enterprise">
              <Button variant="outline" size="lg" className="px-8 py-3 rounded-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
                Enterprise Solutions
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Main Pricing Page Component
export default function PricingPage() {
  // Filter out hidden plans
  const visiblePlans = siteConfig.cloudPricingItems.filter(plan => !plan.hidden);

  return (
    <div className="min-h-screen bg-background">
      <PricingHeroSection />
      
      {/* Pricing Plans Section */}
      <section id="pricing-plans" className="w-full py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose the perfect plan for your needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include access to premium AI models and integrations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {visiblePlans.map((plan, index) => (
              <PricingCard 
                key={index} 
                plan={plan} 
                isPopular={plan.isPopular} 
              />
            ))}
          </div>
        </div>
      </section>
      
      <FeaturesSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
