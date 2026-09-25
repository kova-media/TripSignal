import { TESTIMONIALS } from './testimonials-data';

export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="testimonials shell" aria-label="What travelers say">
      <div className="sample-head"><p className="section-kicker">Travelers</p><h2>People who <em>stopped overpaying.</em></h2></div>
      <div className="testimonial-grid">
        {TESTIMONIALS.map((t) => (
          <figure className="testimonial" key={t.name}>
            <blockquote>“{t.quote}”</blockquote>
            <figcaption><strong>{t.name}</strong><span>{t.detail}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
