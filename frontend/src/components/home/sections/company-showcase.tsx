import { siteConfig } from '@/lib/home';

export function CompanyShowcase() {
  return (
    <section
      id="company"
      className="flex flex-col items-center justify-center gap-10 py-10 pt-20 w-full relative px-6"
    >
      <p className="text-muted-foreground font-medium">
        Trusted by fast-growing startups
      </p>
      <div className="grid w-full grid-cols-2 md:grid-cols-4 overflow-hidden border-y border-border items-center justify-center z-20">
        {/* Removed the code that was displaying logos from siteConfig.companyShowcase */}
      </div>
    </section>
  );
}
