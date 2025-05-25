# CHANGES

## Week of May 18-25, 2025

### Billing & Subscription System
- **Added Free Trial Period**: Implemented a 7-day free trial for all new subscriptions using Stripe's trial period feature
- **Enhanced Promo Code Support**: Ensured promotion codes are properly enabled in the Stripe checkout flow
- **Fixed Subscription API Error**: Removed unsupported parameter that was causing 500 errors in checkout
- **Subscription Management**: Improved handling of subscription upgrades and downgrades

### Agent Management
- **Stop All Agents Feature**: Added a new orange button in the sidebar to stop all running agents simultaneously
- **Performance Optimization**: Rewrote the `stopAllAgents` function to query for running agents and stop them in parallel
- **UX Improvements**: Added loading spinner during agent stopping process and toast notifications for user feedback
- **Search Agents**: Implemented robust search functionality for finding agents by name, description, and content
- **Langfuse Integration**: Added tracing capabilities for better monitoring and debugging of agent runs
- **Agent Error Handling**: Enhanced error recovery and reporting for failed agent runs

### UI/UX Improvements
- **Sidebar Stability Fix**: Resolved issue where sidebar would freeze after renaming projects by properly sequencing state updates
- **Chatbot Widget**: Added Intercom chat support on all pages of the application (later removed)
- **Responsive Feedback**: Improved loading states and error handling throughout the application
- **File Editing**: Enhanced the file editor with improved syntax highlighting and error detection
- **Search Functionality**: Added global search capabilities across projects, files, and agents
- **Theme Consistency**: Fixed styling inconsistencies across different sections of the application

### Content Generation
- **Image Generation Tool**: Implemented new tool for AI-powered image generation
- **Prompt Enhancement**: Added improved prompt templates for better image generation results
- **Image Storage**: Added secure storage for generated images with proper caching
- **Size Options**: Added multiple size options for image generation

### Deployment System
- **Cloudflare Integration**: Updated naming convention for Cloudflare Pages deployments
- **Deployment Naming**: Modified deployment tool to use a random 5-digit number followed by project name (e.g., `12345-my-project`)
- **Domain Handling**: Ensured custom domains remain clean without the number prefix
- **Deploy Tool Fixes**: 
  - Fixed issue with Cloudflare API authentication
  - Resolved deployment failures for projects with special characters
  - Added better error reporting for failed deployments
  - Improved logging of deployment process
  - Fixed timeout issues for larger projects

### Sandbox Environment
- **Isolated Execution**: Implemented secure sandbox for safe code execution
- **Resource Limiting**: Added CPU and memory restrictions to prevent abuse
- **File System Access**: Created controlled file system access for sandbox operations
- **Network Control**: Implemented network isolation and selective connectivity
- **Process Management**: Added robust process spawning and termination capabilities

## Week of May 11-17, 2025

### API & Backend
- **Authentication Improvements**: Enhanced authentication flow and session handling
- **Error Handling**: Added more robust error handling throughout backend services
- **API Performance**: Optimized database queries and API response times
- **Rate Limiting**: Implemented rate limiting for public-facing APIs
- **Webhooks**: Added new webhook endpoints for third-party integrations

### Frontend Framework
- **State Management**: Improved React state management for better component reusability
- **Component Architecture**: Refactored key components for better maintainability
- **CSS Optimizations**: Enhanced styling for better mobile responsiveness
- **Lazy Loading**: Implemented lazy loading for better initial page load performance
- **Error Boundaries**: Added React error boundaries to prevent cascading UI failures

### Documentation
- **API Docs**: Updated API documentation with new endpoints and parameters
- **User Guide**: Enhanced user-facing documentation for new features
- **Developer Setup**: Improved onboarding documentation for new developers
- **Code Comments**: Added comprehensive JSDoc comments to key functions
- **Architecture Diagrams**: Updated system architecture diagrams

### DevOps
- **CI/CD Pipeline**: Enhanced GitHub Actions workflow for faster deployments
- **Testing Framework**: Added more comprehensive testing for critical components
- **Monitoring**: Improved logging and error tracking capabilities
- **Database Backups**: Implemented automated database backup system
- **Infrastructure as Code**: Updated Terraform configurations for cloud resources

### Security
- **Authentication**: Strengthened authentication mechanisms with additional validation
- **Input Sanitization**: Improved input validation and sanitization across the application
- **CORS Policies**: Updated CORS policies for better security
- **Dependency Updates**: Updated third-party dependencies to patch security vulnerabilities
- **Audit Logging**: Enhanced audit logging for sensitive operations
