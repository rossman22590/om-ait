'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const CTASection = () => {
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
