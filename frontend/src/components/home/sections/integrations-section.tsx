'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { SectionHeader } from '@/components/home/section-header';

const integrations = [
  { name: 'HTTP / Webhook', slug: null, desc: 'Send HTTP & webhooks', premium: true },
  { name: 'Node', slug: 'nodedotjs', desc: '400k+ npm packages', premium: true },
  { name: 'Python', slug: 'python', desc: '350k+ PyPI packages', premium: true },
  { name: 'Notion', slug: 'notion', desc: 'All‑in‑one workspace', premium: true },
  { name: 'OpenAI', slug: 'openai', desc: 'ChatGPT, DALL·E', premium: true },
  { name: 'Anthropic', slug: 'anthropic', desc: 'Claude models', premium: true },
  { name: 'Google Sheets', slug: 'googlesheets', desc: 'Real‑time spreadsheets', premium: true },
  { name: 'Telegram', slug: 'telegram', desc: 'Cloud messaging', premium: true },
  { name: 'Google Drive', slug: 'googledrive', desc: 'Store files', premium: true },
  { name: 'Pinterest', slug: 'pinterest', desc: 'Visual discovery', premium: true },
  { name: 'Google Calendar', slug: 'googlecalendar', desc: 'Schedule & reminders', premium: true },
  { name: 'Shopify', slug: 'shopify', desc: 'Commerce platform', premium: true },
  { name: 'Supabase', slug: 'supabase', desc: 'Open source Firebase', premium: true },
  { name: 'MySQL', slug: 'mysql', desc: 'Relational database', premium: true },
  { name: 'PostgreSQL', slug: 'postgresql', desc: 'Advanced RDBMS', premium: true },
  { name: 'Twilio', slug: 'sendgrid', desc: 'Email delivery', premium: true },
  { name: 'Zendesk', slug: 'zendesk', desc: 'Customer service', premium: true },
  { name: 'ServiceNow', slug: null, desc: 'Workflow platform', premium: true },
  { name: 'Slack', slug: 'slack', desc: 'Team messaging', premium: true },
  { name: 'Stripe', slug: 'stripe', desc: 'Payments', premium: true },
  { name: 'GitHub', slug: 'github', desc: 'Code hosting', premium: true },
  { name: 'MongoDB', slug: 'mongodb', desc: 'Document database', premium: true },
  { name: 'GCP', slug: 'googlecloud', desc: 'Google Cloud', premium: true },
  { name: 'Gemini', slug: 'googlegemini', desc: 'Google AI', premium: true },
];

const categories = ['Popular', 'Databases', 'Messaging', 'DevOps', 'Productivity', 'Payments'];

export function IntegrationsSection() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <div className="px-6 py-16">
            <SectionHeader>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center">
                One Click Integrations
              </h2>
              <p className="text-muted-foreground text-center font-medium">
                Embed prebuilt triggers and actions with retries, OAuth, and typed inputs
              </p>
            </SectionHeader>

            {/* Category tabs */}
            <div className="hidden md:flex gap-2 justify-center mb-8">
              {categories.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(i)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    i === activeCategory
                      ? 'bg-secondary/10 text-secondary ring-1 ring-secondary/50'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Integrations grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {integrations.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02 }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center h-28 hover:border-secondary/50 transition-all hover:shadow-lg"
                >
                  {/* Logo */}
                  {p.slug ? (
                    <>
                      <img
                        src={`https://cdn.simpleicons.org/${p.slug}/111827`}
                        alt={`${p.name} logo`}
                        className="h-6 w-6 mb-2 opacity-80 group-hover:opacity-100 transition-opacity dark:hidden"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <img
                        src={`https://cdn.simpleicons.org/${p.slug}/FFFFFF`}
                        alt={`${p.name} logo`}
                        className="h-6 w-6 mb-2 opacity-80 group-hover:opacity-100 transition-opacity hidden dark:block"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </>
                  ) : (
                    <svg
                      className="h-6 w-6 mb-2 opacity-80 group-hover:opacity-100 transition-opacity"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
                    </svg>
                  )}

                  {/* Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-semibold">{p.name}</span>
                      {p.premium && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                      {p.desc}
                    </p>
                  </div>

                  {/* Hover effect */}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>

            {/* View all button */}
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                View all integrations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
