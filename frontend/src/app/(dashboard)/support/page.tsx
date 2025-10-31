"use client";

import { useState, useEffect } from 'react';
import Script from "next/script";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntercomLoader } from "@/components/intercom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  CreditCard,
  Bot,
  Settings,
  Mail,
  ExternalLink,
  Calendar,
  Lightbulb
} from "lucide-react";

export default function SupportPage() {
  const commonIssues = [
    {
      id: 1,
      title: "Billing & Credits",
      description: "Issues with payments, credit transfers, or subscription management",
      icon: <CreditCard className="h-5 w-5" />,
      status: "common",
      solutions: [
        "Check your billing history in Settings > Billing",
        "Verify your payment method is valid and not expired",
        "Contact support for credit transfer issues",
        "Review our pricing plans for upgrade options"
      ]
    },
    {
      id: 2,
      title: "Agent Performance",
      description: "AI agents not responding or performing poorly",
      icon: <Bot className="h-5 w-5" />,
      status: "common",
      solutions: [
        "Check if you have sufficient credits remaining",
        "Try refreshing the page and starting a new conversation",
        "Verify your internet connection is stable",
        "Check our status page for any ongoing issues"
      ]
    },
    {
      id: 3,
      title: "Account Settings",
      description: "Problems with profile, preferences, or account configuration",
      icon: <Settings className="h-5 w-5" />,
      status: "easy",
      solutions: [
        "Navigate to Settings to update your profile",
        "Reset your password if you're having login issues",
        "Check your email preferences in notifications",
        "Contact support for account deletion requests"
      ]
    },
    {
      id: 4,
      title: "Response Delays",
      description: "Agents taking longer than expected to respond",
      icon: <Clock className="h-5 w-5" />,
      status: "known",
      solutions: [
        "Complex requests may take 2-5 minutes to process",
        "Check your internet connection stability",
        "Try breaking complex requests into smaller parts",
        "Monitor our status page for performance updates"
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "common": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "known": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "common": return <AlertCircle className="h-4 w-4" />;
      case "easy": return <CheckCircle className="h-4 w-4" />;
      case "known": return <HelpCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle Calendly close event
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.event === 'calendly.event_type_viewed' || 
          e.data.event === 'calendly.event_scheduled') {
        // Handle events if needed
      } else if (e.data.event === 'calendly.profile_page_viewed') {
        // Handle profile view
      } else if (e.data.event === 'calendly.date_and_time_selected') {
        // Handle date selection
      } else if (e.data.event === 'calendly.event_type_viewed') {
        // Handle event type view
      } else if (e.data.event === 'calendly.profile_page_viewed') {
        // Handle profile page view
      } else if (e.data.event === 'calendly.event_scheduled') {
        // Handle successful scheduling
        setIsCalendlyOpen(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Load Intercom only on this page */}
      <IntercomLoader />
      
      {/* Calendly Modal */}
      <Dialog open={isCalendlyOpen} onOpenChange={setIsCalendlyOpen}>
        <DialogContent className="max-w-4xl h-[700px] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Schedule a Demo</DialogTitle>
          <div className="h-full w-full">
            <iframe 
              src="https://calendly.com/techinschools/machine-walkthrough?embed_domain=myapps.ai&embed_type=Inline"
              width="100%" 
              height="100%" 
              frameBorder="0"
              className="border-0"
              title="Schedule a demo with our team"
              aria-label="Calendar for scheduling a demo"
            />
          </div>
        </DialogContent>
      </Dialog>

      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get help with Machine and find answers to common questions
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).Intercom) {
                (window as any).Intercom('show');
              }
            }}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Chat with Support
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="https://ai-tutor-x-pixio.instatus.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" />
              Status Page
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            asChild
          >
            <a href="https://aitutorxpixio.featurebase.app/" target="_blank" rel="noopener noreferrer">
              <Lightbulb className="mr-2 h-5 w-5" />
              Feedback
            </a>
          </Button>
        </div>
      </div>

      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-pink-600 mb-2">&lt; 30 min</div>
            <div className="text-sm text-muted-foreground">Average Response Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support Availability</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-pink-600 mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Issue Resolution Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Common Issues */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Common Issues & Solutions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {commonIssues.map((issue, idx) => (
            <Card key={issue.id || idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {issue.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {issue.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(issue.status)}>
                    {getStatusIcon(issue.status)}
                    <span className="ml-1 capitalize">{issue.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                    Quick Solutions:
                  </h4>
                  <ul className="space-y-2">
                    {issue.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our support team is here to help you get the most out of Machine. 
            Whether you have a technical question, billing inquiry, or feature request, 
            we're ready to assist you.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Live Chat Support</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get instant help from our support team via the chat widget below
              </p>
              <Button 
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).Intercom) {
                    (window as any).Intercom('show');
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Live Chat
              </Button>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold mb-2">Email Support</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Send us a message and we'll get back to you within 24 hours
              </p>
              <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-700 dark:text-pink-400 dark:hover:bg-pink-950" asChild>
                <a href="mailto:support@myapps.ai">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Us
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Footer Note */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>
          For urgent issues or account-specific problems, please use the live chat feature below. 
          Our team typically responds within 2 minutes during business hours.
        </p>
      </div>
    </div>
  );
}
