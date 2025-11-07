import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/home/ui/accordion';
import { SectionHeader } from '@/components/home/section-header';

const faqList = [
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day money-back guarantee on all purchases."
  },
  {
    question: "How do I contact support?",
    answer: "You can reach us at support@myapps.ai."
  }
  // Add more FAQs as needed
];

export function FAQSection() {
  return (
    <section
      id="faq"
      className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative"
    >
      <div className="w-full px-6">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Have questions? We have answers.
        </p>
      </SectionHeader>

      <div className="max-w-3xl w-full mx-auto px-10">
        <Accordion
          type="single"
          collapsible
          className="w-full border-b-0 grid gap-2"
        >
          {faqList.map((faq, index) => (
            <AccordionItem
              key={index}
              value={index.toString()}
              className="border-0 grid gap-2"
            >
              <AccordionTrigger className="border bg-accent border-border rounded-lg px-4 py-3.5 cursor-pointer no-underline hover:no-underline data-[state=open]:ring data-[state=open]:ring-primary/20">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-3 border text-primary rounded-lg bg-accent">
                <p className="text-primary font-medium leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      </div>
    </section>
  );
}
