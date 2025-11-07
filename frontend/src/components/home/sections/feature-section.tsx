import { SectionHeader } from '@/components/home/section-header';
import { Feature as FeatureComponent } from '@/components/home/ui/feature-slideshow';

const features = [
	{
		id: 1,
		title: 'Autonomous AI Workers',
		description: 'Deploy AI agents to run your business tasks automatically.',
		content: 'Let Machine handle repetitive and complex tasks for you.',
	},
	{
		id: 2,
		title: 'Seamless Integrations',
		description: 'Connect with 100+ apps and services.',
		content: 'Integrate Machine with your favorite tools and platforms.',
	},
	// Add more features as needed
];

export function FeatureSection() {
	return (
		<section
			id="features"
			className="flex flex-col items-center justify-center gap-5 w-full relative px-6"
		>
			<SectionHeader>
				<h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
					Features
				</h2>
				<p className="text-muted-foreground text-center text-balance font-medium">
					Discover the amazing features we offer.
				</p>
			</SectionHeader>
			<div className="w-full h-full lg:h-[450px] flex items-center justify-center">
				<FeatureComponent
					collapseDelay={5000}
					linePosition="bottom"
					featureItems={features}
					lineColor="bg-secondary"
				/>
			</div>
		</section>
	);
}
