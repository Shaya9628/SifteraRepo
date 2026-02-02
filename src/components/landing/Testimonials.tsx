import { Star, Quote } from 'lucide-react';
import testimonialSarah from '@/assets/testimonial-sarah.jpg';
import testimonialMichael from '@/assets/testimonial-michael.jpg';
import testimonialEmily from '@/assets/testimonial-emily.jpg';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Siftera transformed how we onboard new recruiters. What used to take 3 months now takes just 3 weeks. The gamification keeps everyone engaged.",
      name: 'Sarah Chen',
      title: 'Head of Talent Acquisition',
      company: 'TechCorp Inc.',
      image: testimonialSarah,
    },
    {
      quote: "The AI-powered feedback is incredibly accurate. It catches red flags I sometimes miss and has significantly improved our screening consistency across the team.",
      name: 'Michael Rodriguez',
      title: 'HR Director',
      company: 'GlobalHR Solutions',
      image: testimonialMichael,
    },
    {
      quote: "Our team's accuracy went from 72% to 94% in just one month. The leaderboard feature created healthy competition that everyone enjoys.",
      name: 'Emily Watson',
      title: 'Recruitment Manager',
      company: 'InnovateCo',
      image: testimonialEmily,
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-muted/50 via-background to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-primary" />
            Customer Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Loved by{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              HR Professionals
            </span>{' '}
            Everywhere
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our customers have to say about their experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/10 group-hover:text-primary/20 transition-colors" />

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-8 leading-relaxed text-lg">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-card">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.title}
                  </div>
                  <div className="text-xs text-primary font-medium">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;