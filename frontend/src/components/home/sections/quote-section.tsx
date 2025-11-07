/* eslint-disable @next/next/no-img-element */

export function QuoteSection() {
  const quote = {
    text: '“Machine has transformed the way we work. Our productivity is at an all-time high.”',
    author: 'Jane Doe, CTO of Acme Corp',
  };

  return (
    <section className="w-full py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <blockquote className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
          {quote.text}
        </blockquote>
        <p className="text-lg text-muted-foreground">{quote.author}</p>
      </div>
    </section>
  );
}
