'use client';

import { SectionHeader } from '@/components/home/section-header';
import { siteConfig } from '@/lib/home';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface UseCase {
  id: string;
  title: string;
  description: string;
  category: string;
  featured: boolean;
  icon: React.ReactNode;
  image: string;
  url: string;
}

export function UseCasesSection() {
  // Get featured use cases from siteConfig and filter out duplicates
  const seenImages = new Set<string>();
  const featuredUseCases: UseCase[] = (siteConfig.useCases || [])
    .filter((useCase: UseCase) => useCase.featured)
    .filter((useCase: UseCase) => {
      // Skip if we've already seen this image
      if (seenImages.has(useCase.image)) {
        console.warn(`Duplicate image detected for use case: ${useCase.id} - ${useCase.title}`);
        return false;
      }
      seenImages.add(useCase.image);
      return true;
    });

  const [modalOpen, setModalOpen] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState<UseCase | null>(null);

  const handleOpenModal = (useCase: UseCase) => {
    setActiveUseCase(useCase);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveUseCase(null);
  };

  return (
    <section
      id="use-cases"
      className="flex flex-col items-center justify-center w-full relative"
    >
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <div className="px-6 py-16">
            <SectionHeader>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
                See Machine in action
              </h2>
              <p className="text-muted-foreground text-center text-balance font-medium">
                Explore real-world examples of how Machine completes complex tasks autonomously
              </p>
            </SectionHeader>

            <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4 gap-4 w-full mt-8">
              {featuredUseCases.map((useCase: UseCase) => (
                <div
                  key={useCase.id}
                  className="rounded-xl overflow-hidden relative h-fit min-[650px]:h-full flex flex-col md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[1.03] hover:shadow-xl hover:ring-2 hover:ring-primary/30"
                  onClick={() => handleOpenModal(useCase)}
                >
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-secondary/10 p-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-secondary"
                        >
                          {useCase.icon}
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium line-clamp-1">
                        {useCase.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {useCase.description}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <hr className="border-border dark:border-white/20 m-0" />

                    <div className="w-full h-[160px] bg-accent/10">
                      <div className="relative w-full h-full overflow-hidden">
                        <img
                          src={
                            useCase.image ||
                            `https://placehold.co/800x400/f5f5f5/666666?text=Machine+${useCase.title.split(' ').join('+')}`
                          }
                          alt={`Machine ${useCase.title}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Popup */}
            {modalOpen && activeUseCase && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl transition-all duration-300"
                onClick={handleCloseModal}
              >
                <div
                  className="relative max-w-xl w-full p-8 rounded-2xl shadow-lg border border-border bg-white/90 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <button className="absolute top-4 right-4 text-lg text-muted-foreground hover:text-primary focus:outline-none rounded-full bg-muted/40 px-2 py-1" onClick={handleCloseModal} aria-label="Close">
                    <span className="sr-only">Close</span>
                    &times;
                  </button>
                  <div className="flex flex-col items-center gap-2">
                    <img src={activeUseCase.image} alt={activeUseCase.title} className="w-16 h-16 object-cover rounded-xl mb-2 shadow border border-border" />
                    <h3 className="text-xl font-semibold mb-1 text-center text-primary">{activeUseCase.title}</h3>
                    <p className="mb-3 text-muted-foreground text-center text-base">{activeUseCase.description}</p>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm text-primary">Full Example Prompt:</span>
                    <div className="bg-muted/40 rounded-lg p-2 mt-1 text-sm border border-border whitespace-pre-line">
                      {(() => {
                        switch (activeUseCase.id) {
                          case 'uc-1':
                            return `Agent Persona: You are a global market research analyst for Fortune 500 clients.\n\nTask: Scan global markets, news, and financial reports to identify emerging trends in electric vehicles.\n\nContext: Integrate with Bloomberg, Reuters, and social media APIs. Analyze data from the last 12 months.\n\nGoals: Pinpoint top growth regions, forecast market shifts, and recommend actionable investment opportunities for Q1 2026.\n\nConstraints: Only use verified sources, exclude outdated or speculative data.\n\nStep-by-Step Tasks:\n1. Aggregate news, financial, and social data.\n2. Detect trending topics and regions.\n3. Analyze growth rates and market share.\n4. Visualize findings in charts and maps.\n5. Generate executive summary and recommendations.\n\nAdvanced Analytics: Sentiment analysis, predictive modeling, and competitor benchmarking.\n\nOutput: Executive summary PDF, interactive dashboard, and investment recommendations.`;
                          case 'uc-2':
                            return `Agent Persona: You are a customer sentiment analyst for a major product launch.\n\nTask: Aggregate and analyze feedback from reviews, social media, and support channels about our new product.\n\nContext: Data sources include Twitter, Trustpilot, and support emails.\n\nGoals: Highlight sentiment drivers, track changes over time, and generate weekly sentiment reports.\n\nConstraints: Focus on English-language sources, filter out spam and irrelevant content.\n\nStep-by-Step Tasks:\n1. Collect feedback from all channels.\n2. Perform sentiment analysis and topic extraction.\n3. Identify positive and negative drivers.\n4. Visualize sentiment trends.\n5. Summarize actionable insights for product teams.\n\nAdvanced Analytics: Trend detection, influencer impact analysis, and anomaly spotting.\n\nOutput: Sentiment dashboard, weekly report, and improvement recommendations.`;
                          case 'uc-3':
                            return `Agent Persona: You are an automated support responder for a SaaS company.\n\nTask: Reply to all incoming support emails with personalized, accurate answers.\n\nContext: Use company FAQ, ticket history, and escalation rules.\n\nGoals: Resolve issues instantly, escalate urgent cases, and summarize daily support activity.\n\nConstraints: Maintain brand tone, log all responses, and comply with GDPR.\n\nStep-by-Step Tasks:\n1. Parse incoming emails and classify requests.\n2. Match queries to FAQ and ticket history.\n3. Generate personalized replies.\n4. Escalate complex or urgent cases.\n5. Log all interactions and summarize daily activity.\n\nAdvanced Analytics: Response time tracking, satisfaction scoring, and escalation analysis.\n\nOutput: Email replies, daily support summary, and improvement suggestions.`;
                          case 'uc-4':
                            return `Agent Persona: You are a financial forecaster for a retail business.\n\nTask: Predict monthly revenue and expenses for the next 12 months.\n\nContext: Use historical sales, market trends, and seasonality data.\n\nGoals: Visualize projections, flag risks, and recommend mitigation strategies.\n\nConstraints: Exclude outlier events, use only validated data.\n\nStep-by-Step Tasks:\n1. Aggregate historical financial data.\n2. Apply time series forecasting models.\n3. Identify risk factors and anomalies.\n4. Visualize projections and risk areas.\n5. Recommend mitigation strategies.\n\nAdvanced Analytics: Scenario simulation, risk scoring, and sensitivity analysis.\n\nOutput: Financial dashboard, risk report, and action plan.`;
                          case 'uc-5':
                            return `Agent Persona: You are a scheduling coordinator for a distributed team.\n\nTask: Organize meetings and events for the next quarter.\n\nContext: Integrate Google Calendar, Outlook, and Slack.\n\nGoals: Avoid conflicts, optimize for time zones, and send invites with agendas.\n\nConstraints: Respect PTO, holidays, and team preferences.\n\nStep-by-Step Tasks:\n1. Collect team availability and preferences.\n2. Detect conflicts and suggest optimal times.\n3. Generate calendar invites with agendas.\n4. Send reminders and follow-ups.\n5. Summarize meeting schedule and attendance.\n\nAdvanced Analytics: Attendance prediction, time zone optimization, and meeting effectiveness scoring.\n\nOutput: Calendar invites, meeting schedule, and analytics report.`;
                          case 'uc-6':
                            return `Agent Persona: You are a document summarizer for executive teams.\n\nTask: Condense a 50-page technical document into a 1-page executive brief.\n\nContext: Focus on key findings, recommendations, and action items.\n\nGoals: Make summary readable for non-technical stakeholders.\n\nConstraints: No jargon, highlight actionable items, and ensure clarity.\n\nStep-by-Step Tasks:\n1. Parse and analyze the full document.\n2. Extract key findings and recommendations.\n3. Rewrite content for clarity and brevity.\n4. Highlight action items and next steps.\n5. Format summary for executive readability.\n\nAdvanced Analytics: Key phrase extraction, readability scoring, and summary validation.\n\nOutput: Executive summary PDF and action plan.`;
                          case 'uc-7':
                            return `Agent Persona: You are a social media manager for a consumer brand.\n\nTask: Plan, schedule, and post daily content to Twitter, LinkedIn, and Instagram.\n\nContext: Use brand guidelines, trending topics, and analytics.\n\nGoals: Maximize engagement, grow followers, and track analytics.\n\nConstraints: Avoid duplicate posts, comply with platform policies.\n\nStep-by-Step Tasks:\n1. Research trending topics and hashtags.\n2. Create and schedule posts.\n3. Monitor engagement and respond to comments.\n4. Analyze performance and adjust strategy.\n5. Report weekly results to stakeholders.\n\nAdvanced Analytics: Engagement prediction, influencer analysis, and content optimization.\n\nOutput: Content calendar, engagement report, and growth recommendations.`;
                          case 'uc-8':
                            return `Agent Persona: You are a recruiting assistant for a tech company.\n\nTask: Screen resumes for Software Engineer position and schedule interviews.\n\nContext: Use job description, candidate profiles, and availability.\n\nGoals: Shortlist top candidates, automate interview scheduling, and ensure diversity.\n\nConstraints: Follow fair hiring practices, anonymize sensitive data.\n\nStep-by-Step Tasks:\n1. Parse and rank resumes.\n2. Match candidates to job requirements.\n3. Schedule interviews based on availability.\n4. Track interview progress and feedback.\n5. Summarize candidate shortlist and hiring metrics.\n\nAdvanced Analytics: Skill gap analysis, diversity scoring, and interview outcome prediction.\n\nOutput: Interview schedule, candidate shortlist, and hiring report.`;
                          case 'uc-9':
                            return `Agent Persona: You are an enterprise-grade inventory management agent for a global retail chain.\n\nTask: Continuously monitor and analyze real-time stock levels for thousands of SKUs across multiple warehouses, distribution centers, and storefronts.\n\nContext: Integrate with warehouse management systems, supplier APIs, point-of-sale systems, and logistics platforms. Access historical sales data, supplier lead times, and seasonal demand patterns.\n\nGoals: Prevent stockouts, optimize inventory turnover, minimize holding costs, and ensure product availability for all locations.\n\nConstraints: Only restock items below dynamic threshold, prioritize high-demand and high-margin SKUs, factor in supplier reliability, and account for upcoming promotions and holidays.\n\nStep-by-Step Tasks:\n1. Aggregate real-time inventory data from all sources.\n2. Detect low stock and out-of-stock items.\n3. Analyze historical trends and forecast future demand.\n4. Generate automated restock orders with optimal quantities.\n5. Alert supply chain managers for critical SKUs.\n6. Visualize inventory health and trends in a dashboard.\n7. Recommend process improvements for supply chain efficiency.\n\nAdvanced Analytics: Identify slow-moving and fast-moving items, suggest redistribution between locations, and simulate impact of supply chain disruptions.\n\nOutput: Interactive inventory dashboard, prioritized restock alerts, automated order generation, weekly and monthly summary reports, and actionable insights for executive decision-making.`;
                          case 'uc-10':
                            return `Agent Persona: You are a code reviewer for a large software project.\n\nTask: Analyze latest code commits for security, style, and performance.\n\nContext: Use project guidelines, static analysis tools, and commit history.\n\nGoals: Flag vulnerabilities, suggest improvements, and summarize findings.\n\nConstraints: Review only new commits, respect coding standards.\n\nStep-by-Step Tasks:\n1. Fetch latest commits and diffs.\n2. Run static analysis and linting.\n3. Identify security issues and style violations.\n4. Suggest code improvements.\n5. Summarize findings in a report.\n\nAdvanced Analytics: Vulnerability scoring, code quality metrics, and improvement tracking.\n\nOutput: Code review report, improvement checklist, and summary dashboard.`;
                          case 'uc-11':
                            return `Agent Persona: You are a customer support chatbot for an e-commerce site.\n\nTask: Answer website questions instantly, escalate complex queries, and log interactions.\n\nContext: Use knowledge base, escalation matrix, and chat history.\n\nGoals: Maximize first-contact resolution, maintain privacy, and ensure compliance.\n\nConstraints: Only escalate when necessary, log all interactions.\n\nStep-by-Step Tasks:\n1. Parse incoming chat messages.\n2. Match queries to knowledge base.\n3. Generate instant replies.\n4. Escalate complex cases.\n5. Log all chat interactions.\n6. Summarize daily support activity.\n\nAdvanced Analytics: Chat satisfaction scoring, escalation analysis, and FAQ optimization.\n\nOutput: Chat transcripts, escalation log, and support summary.`;
                          case 'uc-12':
                            return `Agent Persona: You are a QA tester for a software release.\n\nTask: Run automated tests on release candidate, report failures, and generate coverage summary.\n\nContext: Use CI/CD pipeline, test suite, and release notes.\n\nGoals: Ensure software quality, highlight critical bugs, and improve coverage.\n\nConstraints: Only test new features, log all failures.\n\nStep-by-Step Tasks:\n1. Run automated test suite.\n2. Collect and analyze test results.\n3. Identify failed tests and critical bugs.\n4. Generate coverage summary.\n5. Report findings to development team.\n\nAdvanced Analytics: Test coverage analysis, bug severity scoring, and regression detection.\n\nOutput: Test report, coverage dashboard, and bug summary.`;
                          case 'uc-13':
                            return `Agent Persona: You are a recommendation engine for an online store.\n\nTask: Analyze user behavior and purchase history to deliver personalized product suggestions.\n\nContext: Use e-commerce analytics, user profiles, and inventory data.\n\nGoals: Increase conversion rates, improve user experience, and boost sales.\n\nConstraints: Exclude out-of-stock items, respect user privacy.\n\nStep-by-Step Tasks:\n1. Aggregate user behavior and purchase data.\n2. Apply collaborative filtering and content-based algorithms.\n3. Generate personalized recommendations.\n4. Visualize recommendations and conversion metrics.\n5. Summarize impact and suggest improvements.\n\nAdvanced Analytics: Conversion prediction, recommendation diversity, and A/B testing.\n\nOutput: Recommendation list, conversion report, and improvement plan.`;
                          case 'uc-14':
                            return `Agent Persona: You are a fraud detection specialist for a fintech platform.\n\nTask: Monitor transactions for fraud, flag suspicious activity, and send alerts.\n\nContext: Use transaction logs, risk models, and user profiles.\n\nGoals: Prevent financial loss, minimize false positives, and ensure compliance.\n\nConstraints: Real-time detection only, respect privacy laws.\n\nStep-by-Step Tasks:\n1. Monitor incoming transactions.\n2. Apply risk models and anomaly detection.\n3. Flag suspicious activity.\n4. Send alerts to security team.\n5. Log incidents and outcomes.\n6. Summarize fraud trends and prevention strategies.\n\nAdvanced Analytics: Fraud scoring, false positive analysis, and incident tracking.\n\nOutput: Fraud alerts, incident report, and prevention recommendations.`;
                          case 'uc-15':
                            return `Agent Persona: You are a transcription assistant for business meetings.\n\nTask: Transcribe audio files, organize by topic, and highlight action items.\n\nContext: Use speech-to-text APIs, meeting agendas, and participant lists.\n\nGoals: Make transcripts searchable, accurate, and actionable.\n\nConstraints: Ensure privacy, comply with data protection laws.\n\nStep-by-Step Tasks:\n1. Convert audio to text using speech-to-text.\n2. Organize transcript by topic and speaker.\n3. Highlight action items and decisions.\n4. Summarize meeting outcomes.\n5. Format transcript for easy search.\n\nAdvanced Analytics: Speaker identification, topic clustering, and action item extraction.\n\nOutput: Organized transcripts, action item summary, and searchable archive.`;
                          case 'uc-16':
                            return `Agent Persona: You are a smart home automation manager.\n\nTask: Automate routines for devices, adjust settings based on weather, and send usage reports.\n\nContext: Integrate with smart home APIs, weather data, and user preferences.\n\nGoals: Optimize comfort, energy use, and device reliability.\n\nConstraints: Respect user privacy and preferences.\n\nStep-by-Step Tasks:\n1. Collect device and weather data.\n2. Analyze usage patterns and preferences.\n3. Automate device routines and settings.\n4. Send usage reports to users.\n5. Suggest optimizations and improvements.\n\nAdvanced Analytics: Energy consumption prediction, comfort scoring, and device health monitoring.\n\nOutput: Automation schedule, usage analytics, and optimization suggestions.`;
                          case 'uc-17':
                            return `Agent Persona: You are a medical diagnosis assistant for clinics.\n\nTask: Analyze patient symptoms, suggest conditions, and recommend treatment steps.\n\nContext: Use medical records, guidelines, and symptom databases.\n\nGoals: Support doctors in diagnosis, flag urgent cases, and improve patient outcomes.\n\nConstraints: Respect patient privacy, comply with HIPAA.\n\nStep-by-Step Tasks:\n1. Parse patient symptoms and history.\n2. Match symptoms to possible conditions.\n3. Recommend diagnostic tests and treatments.\n4. Flag urgent or critical cases.\n5. Summarize findings for doctors.\n\nAdvanced Analytics: Differential diagnosis, risk scoring, and treatment outcome prediction.\n\nOutput: Diagnostic report, treatment recommendations, and risk alerts.`;
                          case 'uc-18':
                            return `Agent Persona: You are an energy analyst for commercial buildings.\n\nTask: Monitor energy consumption, identify inefficiencies, and recommend cost-saving steps.\n\nContext: Use smart meter data, building plans, and historical usage.\n\nGoals: Reduce costs, lower carbon footprint, and improve efficiency.\n\nConstraints: Only actionable recommendations, respect building constraints.\n\nStep-by-Step Tasks:\n1. Collect and analyze energy usage data.\n2. Identify inefficiencies and waste.\n3. Recommend cost-saving actions.\n4. Visualize energy trends and savings.\n5. Summarize impact and next steps.\n\nAdvanced Analytics: Consumption forecasting, savings simulation, and efficiency scoring.\n\nOutput: Energy report, savings plan, and efficiency dashboard.`;
                          case 'uc-19':
                            return `Agent Persona: You are a translation specialist for global support teams.\n\nTask: Translate customer support chat logs from Spanish to English, preserve context and tone, and summarize common issues.\n\nContext: Use translation memory, support database, and chat history.\n\nGoals: Improve support quality, ensure accurate translations, and identify common issues.\n\nConstraints: Maintain confidentiality, respect cultural nuances.\n\nStep-by-Step Tasks:\n1. Parse and segment chat logs.\n2. Translate messages while preserving tone.\n3. Summarize common issues and solutions.\n4. Visualize translation accuracy and trends.\n5. Report findings to support teams.\n\nAdvanced Analytics: Context preservation, issue clustering, and translation quality scoring.\n\nOutput: Translated logs, issue summary, and quality report.`;
                          case 'uc-20':
                            return `Agent Persona: You are a remote device monitor for industrial IoT networks.\n\nTask: Monitor sensors, notify for offline events, visualize data trends, and generate health reports.\n\nContext: Use IoT platform, device logs, and real-time data streams.\n\nGoals: Minimize downtime, optimize device health, and alert for critical events.\n\nConstraints: Real-time monitoring only, respect device privacy.\n\nStep-by-Step Tasks:\n1. Collect sensor and device data.\n2. Detect offline or malfunctioning devices.\n3. Visualize data trends and health metrics.\n4. Generate health reports and alerts.\n5. Recommend maintenance actions.\n\nAdvanced Analytics: Downtime prediction, health scoring, and maintenance optimization.\n\nOutput: Device health dashboard, alert log, and maintenance plan.`;
                          default:
                            return `Agent Persona: You are an expert agent. Task: ${activeUseCase.title}. Context: Use all available data and tools. Goal: Achieve best results. Constraints: Follow best practices. Output: Detailed report.`;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm text-primary">Why use this?</span>
                    <div className="bg-muted/40 rounded-lg p-2 mt-1 text-sm border border-border">
                      {`Automate and optimize ${activeUseCase.title.toLowerCase()}, prevent costly errors, and empower managers with actionable insights.`}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm text-primary">Example Tool Used:</span>
                    <div className="bg-muted/40 rounded-lg p-2 mt-1 text-sm border border-border">
                      {`Machine Core, API Integrations, Advanced Analytics`}
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="font-semibold text-sm text-primary">Workflow Breakdown:</span>
                    <ul className="list-disc ml-6 mt-1 text-sm">
                      {(() => {
                        switch (activeUseCase.id) {
                          case 'uc-1':
                            return (<>
                              <li>Aggregate news, financial, and social data</li>
                              <li>Detect trending topics and regions</li>
                              <li>Analyze growth rates and market share</li>
                              <li>Visualize findings in charts and maps</li>
                              <li>Generate executive summary and recommendations</li>
                            </>);
                          case 'uc-2':
                            return (<>
                              <li>Collect feedback from all channels</li>
                              <li>Perform sentiment analysis and topic extraction</li>
                              <li>Identify positive and negative drivers</li>
                              <li>Visualize sentiment trends</li>
                              <li>Summarize actionable insights for product teams</li>
                            </>);
                          case 'uc-3':
                            return (<>
                              <li>Parse incoming emails and classify requests</li>
                              <li>Match queries to FAQ and ticket history</li>
                              <li>Generate personalized replies</li>
                              <li>Escalate complex or urgent cases</li>
                              <li>Log all interactions and summarize daily activity</li>
                            </>);
                          case 'uc-4':
                            return (<>
                              <li>Aggregate historical financial data</li>
                              <li>Apply time series forecasting models</li>
                              <li>Identify risk factors and anomalies</li>
                              <li>Visualize projections and risk areas</li>
                              <li>Recommend mitigation strategies</li>
                            </>);
                          case 'uc-5':
                            return (<>
                              <li>Collect team availability and preferences</li>
                              <li>Detect conflicts and suggest optimal times</li>
                              <li>Generate calendar invites with agendas</li>
                              <li>Send reminders and follow-ups</li>
                              <li>Summarize meeting schedule and attendance</li>
                            </>);
                          case 'uc-6':
                            return (<>
                              <li>Parse and analyze the full document</li>
                              <li>Extract key findings and recommendations</li>
                              <li>Rewrite content for clarity and brevity</li>
                              <li>Highlight action items and next steps</li>
                              <li>Format summary for executive readability</li>
                            </>);
                          case 'uc-7':
                            return (<>
                              <li>Research trending topics and hashtags</li>
                              <li>Create and schedule posts</li>
                              <li>Monitor engagement and respond to comments</li>
                              <li>Analyze performance and adjust strategy</li>
                              <li>Report weekly results to stakeholders</li>
                            </>);
                          case 'uc-8':
                            return (<>
                              <li>Parse and rank resumes</li>
                              <li>Match candidates to job requirements</li>
                              <li>Schedule interviews based on availability</li>
                              <li>Track interview progress and feedback</li>
                              <li>Summarize candidate shortlist and hiring metrics</li>
                            </>);
                          case 'uc-9':
                            return (<>
                              <li>Aggregate real-time inventory data from all sources</li>
                              <li>Detect low stock and out-of-stock items</li>
                              <li>Analyze historical trends and forecast future demand</li>
                              <li>Generate automated restock orders with optimal quantities</li>
                              <li>Alert supply chain managers for critical SKUs</li>
                              <li>Visualize inventory health and trends in a dashboard</li>
                              <li>Recommend process improvements for supply chain efficiency</li>
                            </>);
                          case 'uc-10':
                            return (<>
                              <li>Fetch latest commits and diffs</li>
                              <li>Run static analysis and linting</li>
                              <li>Identify security issues and style violations</li>
                              <li>Suggest code improvements</li>
                              <li>Summarize findings in a report</li>
                            </>);
                          case 'uc-11':
                            return (<>
                              <li>Parse incoming chat messages</li>
                              <li>Match queries to knowledge base</li>
                              <li>Generate instant replies</li>
                              <li>Escalate complex cases</li>
                              <li>Log all chat interactions</li>
                              <li>Summarize daily support activity</li>
                            </>);
                          case 'uc-12':
                            return (<>
                              <li>Run automated test suite</li>
                              <li>Collect and analyze test results</li>
                              <li>Identify failed tests and critical bugs</li>
                              <li>Generate coverage summary</li>
                              <li>Report findings to development team</li>
                            </>);
                          case 'uc-13':
                            return (<>
                              <li>Aggregate user behavior and purchase data</li>
                              <li>Apply collaborative filtering and content-based algorithms</li>
                              <li>Generate personalized recommendations</li>
                              <li>Visualize recommendations and conversion metrics</li>
                              <li>Summarize impact and suggest improvements</li>
                            </>);
                          case 'uc-14':
                            return (<>
                              <li>Monitor incoming transactions</li>
                              <li>Apply risk models and anomaly detection</li>
                              <li>Flag suspicious activity</li>
                              <li>Send alerts to security team</li>
                              <li>Log incidents and outcomes</li>
                              <li>Summarize fraud trends and prevention strategies</li>
                            </>);
                          case 'uc-15':
                            return (<>
                              <li>Convert audio to text using speech-to-text</li>
                              <li>Organize transcript by topic and speaker</li>
                              <li>Highlight action items and decisions</li>
                              <li>Summarize meeting outcomes</li>
                              <li>Format transcript for easy search</li>
                            </>);
                          case 'uc-16':
                            return (<>
                              <li>Collect device and weather data</li>
                              <li>Analyze usage patterns and preferences</li>
                              <li>Automate device routines and settings</li>
                              <li>Send usage reports to users</li>
                              <li>Suggest optimizations and improvements</li>
                            </>);
                          case 'uc-17':
                            return (<>
                              <li>Parse patient symptoms and history</li>
                              <li>Match symptoms to possible conditions</li>
                              <li>Recommend diagnostic tests and treatments</li>
                              <li>Flag urgent or critical cases</li>
                              <li>Summarize findings for doctors</li>
                            </>);
                          case 'uc-18':
                            return (<>
                              <li>Collect and analyze energy usage data</li>
                              <li>Identify inefficiencies and waste</li>
                              <li>Recommend cost-saving actions</li>
                              <li>Visualize energy trends and savings</li>
                              <li>Summarize impact and next steps</li>
                            </>);
                          case 'uc-19':
                            return (<>
                              <li>Parse and segment chat logs</li>
                              <li>Translate messages while preserving tone</li>
                              <li>Summarize common issues and solutions</li>
                              <li>Visualize translation accuracy and trends</li>
                              <li>Report findings to support teams</li>
                            </>);
                          case 'uc-20':
                            return (<>
                              <li>Collect sensor and device data</li>
                              <li>Detect offline or malfunctioning devices</li>
                              <li>Visualize data trends and health metrics</li>
                              <li>Generate health reports and alerts</li>
                              <li>Recommend maintenance actions</li>
                            </>);
                          default:
                            return (<li>Automate with Machine agent and integrated tools</li>);
                        }
                      })()}
                    </ul>
                  </div>
                  <a href="/dashboard" className="block w-full mt-2">
                    <button className="w-full py-3 rounded-xl bg-primary text-white font-bold text-base shadow hover:bg-primary/90 transition">Try Now</button>
                  </a>
                </div>
              </div>
            )}

            {featuredUseCases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">No use cases available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
