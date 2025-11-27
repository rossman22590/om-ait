import { ChangelogData } from "../sections/changelog";

export const changeLogData: ChangelogData[] = [
    {
      version: "Version 10.6.0",
      date: "November 2025",
      title: "UI Refresh, Tool Management, and Enhanced UX",
      description:
        "A comprehensive visual refresh with pink/purple branding, streamlined tool configuration, and improved homepage animations. Machine gets a modern makeover with better developer experience and granular control.",
      items: [
        "Complete UI Refresh - New pink/purple gradient theme replacing blue across the platform",
        "Rebranded to 'Machine' - Updated from Machine with focus on private AI workspaces",
        "Homepage Redesign - Added interactive demo section with 3D tilt effects and animated workflows",
        "New Integrations Showcase - Visual grid of 24+ integrations with category filters and premium badges",
        "Enhanced Tool Configuration - Added 'Select All' and 'Deselect All' buttons for bulk tool management",
        "Improved Loader Animation - Pink/purple gradient loader with consistent theming",
        "Streamlined Use Cases Section - Removed redundant links and standardized page width",
        "Updated Color System - Modern oklch color space for better color accuracy",
        "Component Architecture Improvements - Cleaner section-based homepage structure",
        "Migration Banner Controls - Added ability to hide plan migration notifications",
        "Build Optimization - Fixed lightningcss dependencies for Railway deployments",
        "DotGrid Component Fix - Resolved TypeScript expression errors",
        "Toast Notifications - Better user feedback for tool selection actions"
      ],
      image: "/meta.png",
      button: {
        url: "/",
        text: "See the New Look",
      },
    },
    {
      version: "Version 10.4.0",
      date: "Sept 2025",
      title: "Introducing Custom Agents, Agent Marketplace, and much more!",
      description:
        "The most significant update for Machine yet. Build, customize, and share AI agents. Connect any service, automate complex workflows, and discover a thriving marketplace of community-built agents.",
      items: [
        "Custom Agent Builder - Create specialized AI Workers with tailored system prompts and behaviors",
        "Model Context Protocol (MCP) Integration - Connect agents to any external service",
        "Agent Marketplace - Discover, install, and share agents with the community",
        "Version Control for Agents - Track changes, create versions, and rollback safely",
        "Advanced Agent Configuration - Fine-tune model parameters, tools, and capabilities",
        "Enterprise-Grade Security - Encrypted credential management and secure agent execution",
        "Pipedream Integration - Native support for profiles and workflow triggers/actions",
        "Composio Integration - One-click access to hundreds of SaaS actions and APIs",
        "Google Sheets Tool - Create, read, write, append rows, and update cells from agents",
        "Fragments (Pro+) - Advanced workflow automation portal with tier-gated access",
        "GPT-5 as default model with recommendation badges across aliases",
        "GPT-5 Mini variant for faster, cost-efficient tasks",
        "Machine Code - New code-generation and execution primitives for agents"
      ],
      image: "/meta.png",
      button: {
        url: "/agents",
        text: "Explore Agents",
      },
    },
    {
      version: "Version 9.7.0",
      date: "July 2025",
      title: "Performance, Stability, and Billing Improvements",
      description:
        "A focused release delivering faster agent runs, more reliable streaming, and clearer billing with usage-based minutes. This sets the stage for the big v10 feature launch.",
      items: [
        "Streaming reliability improvements and message preservation across navigation",
        "Stability fixes for browser automation with better retry and error handling",
        "Usage-based billing UI with minutes used/remaining display",
        "Simplified subscription tiers (monthly-only) and Stripe checkout flow",
        "Model name normalization for accurate token cost calculation",
        "Security hardening for workspace and sandbox access checks",
        "Avatar/Image generation tooling refinements and API key support",
        "Visual Workflow Designer - Build complex multi-step workflows with conditional logic",
        "Unified Integrations Hub - Manage all your service connections in one place"
      ],
    },
    {
      version: "Version 9.6.0",
      date: "June 2025",
      title: "Agent Versioning and Builder UX",
      description:
        "Introduces proper agent versioning, cleaner configuration UI, and improved model pricing accuracy.",
      items: [
        "AgentConfigTool now creates versions with full history and rollback",
        "Builder-only access to AgentConfigTool with safe defaults",
        "Model pricing accuracy with cleaned model names and alias support",
        "Configuration UI simplification for easier prompt and tools management"
      ],
    },
    {
      version: "Version 9.5.0",
      date: "May 2025",
      title: "Billing Overhaul and Pricing Updates",
      description:
        "Moved fully to monthly-only tiers, refreshed pricing, and improved plan detection.",
      items: [
        "Removed yearly and yearly-commitment plans across backend and frontend",
        "Updated plan comparison with new Pro and Enterprise price IDs (backward compatible)",
        "Server-driven usage calculation with clear minutes used/remaining",
        "Checkout flow stabilized with dedicated API route and client-side redirect"
      ],
    },
    {
      version: "Version 9.4.0",
      date: "Apr 2025",
      title: "Streaming Stability and Error Handling",
      description:
        "Major reliability improvements to streaming, navigation, and automation resilience.",
      items: [
        "Messages persist after completion; content no longer disappears",
        "Removed loop detection and session time limits; clearer error messages",
        "Enhanced retry logic and backend error handling for long runs",
        "Automatic agent restart capability on run failures"
      ],
    },
    {
      version: "Version 9.3.0",
      date: "Apr 2025",
      title: "Default Agent and Costing Fixes",
      description:
        "Ensures Machine auto-installs as default and fixes provider recognition for billing.",
      items: [
        "Auto-install Machine on first run in both start_agent and initiate paths",
        "Admin utility to fix default status and metadata for existing users",
        "Model name cleanup and aliasing to prevent provider resolution errors",
        "Comprehensive logging and error handling around agent initialization"
      ],
    },
    {
      version: "Version 9.2.0",
      date: "Apr 2025",
      title: "Marketplace and Sidebar UX",
      description:
        "Improves discoverability and access control for pro features and templates.",
      items: [
        "Marketplace search now filters results instantly across name, description, and tags",
        "Sidebar simplified with consistent labeling and filtered render (no duplicate state)",
        "Fragments entry added with tier-gated access and clear upgrade path",
        "General UI polish across home and pricing sections"
      ],
    },
    {
      version: "Version 9.1.0",
      date: "Apr 2025",
      title: "Media Tools and Integrations",
      description:
        "Adds avatar and image generation capabilities with better local handling.",
      items: [
        "Argil Avatar Generation tool integrated with polling support",
        "Image generation tool simplified with XML schemas and local image saving",
        "Vision prompt updates for automatic image detection and processing",
      ],
    },
    {
      version: "Version 9.0.0",
      date: "Apr 2025",
      title: "Infrastructure and Security Foundation",
      description:
        "Sets the groundwork for reliability: new Docker image, migrations, and security fixes.",
      items: [
        "Dockerfile with parity to UV-based build",
        "Database migrations foundation with rollback guides and safety classification",
        "Schema access fixes and safer auth checks for threads and sandbox",
        "Improved environment handling and development fallbacks"
      ],
    },
  ];