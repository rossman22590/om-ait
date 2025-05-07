"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Info, CreditCard, Clock, Zap, Shield, HeartHandshake, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useId } from 'react';
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { ArrowRight } from "lucide-react";
import { config } from "@/lib/config";

// Centralized pricing data
const pricingData = {
  plans: [
    {
      id: 'free',
      name: 'Free',
      description: 'Get started with',
      price: '$0',
      duration: '/forever',
      popular: false,
      features: [
        '60 min',
        'Public Projects', 
        'Basic Model (Limited capabilities)'
      ],
      buttonText: 'Hire Machine',
      priceCaption: 'No credit card required',
      stripePriceId: config.SUBSCRIPTION_TIERS.FREE.priceId,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Everything in Free, plus:',
      price: '$20',
      duration: '/per month',
      popular: true,
      features: [
        '2 hours',
        'Private projects',
        'Access to intelligent Model (Full Machine)',
      ],
      buttonText: 'Hire Machine',
      priceCaption: 'Cancel anytime',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_2_20.priceId,
    },
    {
      id: 'enterprise',
      name: 'Custom',
      description: 'Enterprise Plan:',
      price: 'Custom Hours',
      duration: '',
      popular: false,
      features: [
        'Starts at 6 hours',
        'Private projects',
        'Full capability access',
        'Custom integrations',
        'Suited to your needs'
      ],
      buttonText: 'Hire Machine',
      priceCaption: 'Volume discounts available',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_6_50.priceId,
    }
  ],
  upgradePlans: [
    {
      hours: '6 hours',
      price: '$50',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_6_50.priceId,
    },
    {
      hours: '12 hours',
      price: '$100',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_12_100.priceId,
    },
    {
      hours: '25 hours',
      price: '$200',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_25_200.priceId,
    },
    {
      hours: '50 hours',
      price: '$400',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_50_400.priceId,
    },
    {
      hours: '125 hours',
      price: '$800',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_125_800.priceId,
    },
    {
      hours: '200 hours',
      price: '$1000',
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_200_1000.priceId,
    },
  ],
  comparisonFeatures: [
    {
      feature: "Monthly Usage",
      free: "60 min",
      pro: "2 hours",
      enterprise: "6+ hours"
    },
    {
      feature: "Project Visibility",
      free: "Public only",
      pro: "Private",
      enterprise: "Private"
    },
    {
      feature: "AI Model",
      free: "Basic",
      pro: "Advanced",
      enterprise: "Full Suite"
    },
    {
      feature: "Custom Integrations",
      free: "-",
      pro: "-",
      enterprise: "✓"
    },
    {
      feature: "Support Level",
      free: "Community",
      pro: "Email",
      enterprise: "Dedicated"
    }
  ]
};

export default function PricingPage() {
  // Adding a unique key prop for component re-render
  const renderKey = useId();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Section with Animated Dots Background */}
      <div className="w-full relative overflow-hidden py-24 md:py-32">
        {/* Animated Dots Background */}
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
        
        <div className="container max-w-7xl mx-auto relative z-10 px-4 md:px-6">
          <div className="text-center">
            <div className="inline-block rounded-full bg-pink-100 dark:bg-pink-900/30 px-3 py-1 text-sm text-pink-600 dark:text-pink-300 mb-4">
              Simple & Transparent
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-pink-500 dark:from-white dark:to-pink-400">
              Transparent Pricing 
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan based on your usage requirements. All plans include access to Machine's core autonomous capabilities.
            </p>
            <div className="flex justify-center mt-8">
              <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        {/* Pricing Section from Homepage */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary dark:from-white dark:to-primary-foreground">Pricing Plans</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-3xl mx-auto">Choose the right plan for your autonomous agent needs with transparent, usage-based pricing.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {pricingData.plans.map((plan, i) => (
            <div key={plan.id} className="flex">
              <motion.div 
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col w-full"
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
              >
                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border ${plan.popular ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} overflow-hidden h-full flex flex-col relative`}>
                  {plan.popular && (
                    <div className="absolute top-6 right-6 rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
                      POPULAR
                    </div>
                  )}
                  <div className="p-6 sm:p-8 flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">{plan.description}</p>
                    <div className="flex items-end mb-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-300 ml-1 pb-1">{plan.duration}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{plan.priceCaption}</p>
                    <ul className="mt-4 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle2 className="text-green-500 h-5 w-5 mr-2 shrink-0 mt-0.5" />
                          <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 sm:p-8 pt-0">
                    <Link href={plan.id === 'free' ? '/auth' : `/settings/billing`} className={`inline-flex justify-center items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg ${
                      plan.popular 
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                    } transition-all duration-200 focus:outline-none`}>
                      {plan.buttonText}
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
        
        {/* Usage Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Plan Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-6 text-left font-medium">Feature</th>
                  <th className="py-4 px-6 text-center font-medium">Free</th>
                  <th className="py-4 px-6 text-center font-medium">Pro</th>
                  <th className="py-4 px-6 text-center font-medium">Custom</th>
                </tr>
              </thead>
              <tbody>
                {pricingData.comparisonFeatures.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="py-3 px-6 font-medium">{row.feature}</td>
                    <td className="py-3 px-6 text-center">{row.free}</td>
                    <td className="py-3 px-6 text-center">{row.pro}</td>
                    <td className="py-3 px-6 text-center">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: "How is usage calculated?",
                answer: "Usage is calculated based on the active processing time Machine spends working on your tasks. This includes time spent planning, researching, executing tasks, and generating outputs. Idle time when Machine is waiting for your response is not counted against your usage limits."
              },
              {
                question: "What happens if I exceed my monthly limit?",
                answer: "If you reach your monthly usage limit, you'll receive a notification. You can either wait until the next billing cycle for your minutes to reset, or upgrade to a higher plan to continue using the service immediately."
              },
              {
                question: "Can I switch between plans?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, giving you instant access to additional features and minutes. Downgrades will take effect at the start of your next billing cycle."
              },
              {
                question: "Do unused minutes roll over?",
                answer: "No, unused minutes do not roll over to the next month. Your allocation resets at the beginning of each billing cycle."
              }
            ].map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="rounded-xl bg-muted/50 border p-8 text-center mb-16">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            For organizations with specialized requirements, we offer custom plans tailored to your specific needs. Contact our sales team to discuss a solution that works for you.
          </p>
          <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
            Contact Sales
          </Button>
        </div>

      </div>

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
                <Link href="/faq">
                  <span>Read FAQ</span>
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
