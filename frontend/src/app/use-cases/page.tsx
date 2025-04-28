"use client";

import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { siteConfig } from "@/lib/home";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/home/sections/navbar";
import { Button } from "@/components/ui/button";

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      {/* Hero section */}
      <section className="w-full py-20 lg:py-28 relative overflow-hidden">
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
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <div className="inline-block rounded-full bg-pink-100 dark:bg-pink-900/30 px-3 py-1 text-sm text-pink-600 dark:text-pink-300 mb-4">
              Explore AI Capabilities
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-pink-500 dark:from-white dark:to-pink-400">
              Use Cases
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              Discover how AI Tutor Machine can transform your learning experience with personalized guidance and support.
            </p>
          </div>
          <div className="flex justify-center mt-8">
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="container max-w-7xl mx-auto relative z-10 pb-20 flex justify-center mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
          {siteConfig.useCases.map((useCase) => (
            <div 
              key={useCase.id} 
              className="relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition duration-300 group h-[380px]"
            >
              <div className="absolute inset-0 z-0">
                <Image 
                  src={useCase.image} 
                  alt={useCase.title} 
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black opacity-60 group-hover:opacity-70 transition duration-300" />
              </div>
              
              <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="mb-2 text-white">{useCase.icon}</div>
                <h3 className="text-2xl font-semibold mb-2 text-white">{useCase.title}</h3>
                <p className="text-gray-200 mb-4 flex-grow">{useCase.description}</p>
                <div className="mt-auto">
                  <Link 
                    href="#" 
                    className="inline-flex items-center text-white hover:text-pink-300 font-medium"
                  >
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
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