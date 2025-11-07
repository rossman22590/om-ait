import { SectionHeader } from '@/components/home/section-header';
// import { SocialProofTestimonials } from '@/components/home/testimonial-scroll'; // Not found, commented out
import { siteConfig } from '@/lib/home';

export function TestimonialSection() {
  return (
    <section
      id="testimonials"
      className="flex flex-col items-center justify-center w-full"
    >
      <div className="w-full px-6">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Empower Your Workflow with AI
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Ask your AI Worker for real-time collaboration, seamless integrations,
          and actionable insights to streamline your operations.
        </p>
      </SectionHeader>
      {/* Placeholder for testimonials scroll */}
      <div className="bg-muted/20 rounded-xl p-8">
        <p className="text-xl text-muted-foreground">Testimonials coming soon.</p>
      </div>
      </div>
    </section>
  );
}
