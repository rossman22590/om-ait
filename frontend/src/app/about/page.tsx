import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, TwitterIcon, CheckCircle2, ExternalLink, MapPin, Mail, Users } from "lucide-react";
import { Navbar } from "@/components/home/sections/navbar";

export const metadata: Metadata = {
  title: "About Machine | Autonomous AI Agent",
  description: "Learn about Machine - the fully autonomous AI agent capable of completing complex tasks without supervision. Discover our mission, team, and technology."
};

export default function AboutPage() {
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
              Redefining AI Assistance
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-pink-500 dark:from-white dark:to-pink-400">
              Our Mission
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              Building autonomous AI agents that expand human potential and transform how we interact with technology.
            </p>
          </div>
          
          <div className="flex justify-center mt-8">
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="w-full py-12 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-pink-500 dark:text-pink-400">900K+</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tasks Completed</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-pink-500 dark:text-pink-400">98%</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-pink-500 dark:text-pink-400">4.9/5</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">User Rating</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-pink-500 dark:text-pink-400">25+</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Industries Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* About content */}
      <section className="w-full py-16 bg-white dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="relative">
                <Image
                  src="/home.png"
                  alt="About Machine"
                  width={600}
                  height={400}
                  className="rounded-lg w-full h-auto object-cover shadow-lg"
                />
                <div className="absolute -bottom-6 -right-6 bg-pink-500 text-white p-4 rounded-lg shadow-lg">
                  <p className="text-sm font-semibold">Founded in 2025</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About Machine</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Machine is the world's first fully autonomous AI agent capable of performing complex tasks without human supervision. 
                Founded in 2025, we're on a mission to create AI systems that can work independently to solve problems across 
                domains ranging from data analysis to coding, research to content creation.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">Autonomous Operation</h3>
                    <p className="text-gray-600 dark:text-gray-300">Our AI agents work independently without constant supervision, making decisions and executing complex tasks.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">Contextual Understanding</h3>
                    <p className="text-gray-600 dark:text-gray-300">Machine agents understand context, remember previous interactions, and adapt to changing requirements.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">Transparent Processing</h3>
                    <p className="text-gray-600 dark:text-gray-300">Our technology provides clear explanations of its reasoning and actions, building trust through transparency.</p>
                  </div>
                </div>
              </div>
              
              <Link href="/pricing" className="inline-flex items-center text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 font-medium">
                Explore our plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vision section */}
      <section className="w-full py-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We envision a world where autonomous AI agents work alongside humans, handling routine and complex tasks 
              while freeing people to focus on creativity, innovation, and meaningful connections. Machine isn't about 
              replacing humans—it's about expanding human potential.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Human-Centered AI</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We design AI systems that adapt to human needs and preferences, not the other way around.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                <ExternalLink className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Boundless Potential</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our technology breaks through traditional AI limitations to achieve true autonomous problem-solving.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Global Impact</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Machine aims to make autonomous AI accessible to individuals and organizations around the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team section */}
      <section className="w-full py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Team</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Machine was developed by a talented and passionate team with expertise in AI, software engineering, 
              and user experience design. Our collective mission is to build autonomous AI agents that expand 
              human potential and transform how we interact with technology.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12">
            {[
              { name: "Ross Cohen", role: "Project Lead", image: "/1.png" },
              { name: "Alisher Farhadi", role: "AI Engineer", image: "/2.jpg" },
              { name: "Nick Kukaj", role: "Full Stack Developer", image: "/3.png" },
              
            ].map((member, i) => (
              <div key={i} className="text-center group">
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  {member.image ? (
                    <Image 
                      src={member.image}
                      alt={member.name}
                      width={300}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="bg-gray-200 dark:bg-gray-700 h-64 w-full animate-pulse"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 w-full text-center">
                      <div className="flex justify-center space-x-3">
                        <a href="#" className="text-white hover:text-pink-300">
                          <TwitterIcon className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-white hover:text-pink-300">
                          <Github className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-white hover:text-pink-300">
                          <Mail className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
              </div>
            ))}
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
