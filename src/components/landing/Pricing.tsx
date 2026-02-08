import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Try AI resume screening',
      features: [
        '2 resume uploads FREE',
        'AI analysis & red flags',
        'Skill matching scores',
        'Personal dashboard',
        'Email support',
      ],
      cta: 'Start Free Now',
      highlighted: false,
      isFree: true,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For HR professionals',
      features: [
        'Unlimited uploads',
        'Advanced AI analysis',
        'All badges & analytics',
        'Custom rubrics',
        'Priority support',
        'Export reports',
      ],
      cta: 'Start Pro Trial',
      highlighted: true,
      isFree: false,
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: '/month',
      description: 'For teams & organizations',
      features: [
        'Everything in Pro',
        'Team workspaces (10 users)',
        'Admin dashboard',
        'Team analytics',
        'API access & SSO',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
      isFree: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Simple,{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border ${
                plan.highlighted
                  ? 'bg-card border-primary shadow-xl shadow-primary/10 scale-105'
                  : plan.isFree
                  ? 'bg-gradient-to-br from-emerald-50/50 to-card dark:from-emerald-950/20 border-emerald-500/50 hover:border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-card border-border hover:border-primary/50'
              } transition-all`}
            >
              {/* FREE Ribbon for Free Plan */}
              {plan.isFree && (
                <div className="absolute -top-4 -right-4 w-20 h-20 overflow-hidden">
                  <div className="absolute top-5 -right-5 w-28 text-center py-1 bg-emerald-500 text-white text-xs font-bold transform rotate-45 shadow-md">
                    FREE
                  </div>
                </div>
              )}
              
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.highlighted ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full ${plan.isFree ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}
                variant={plan.highlighted ? 'default' : plan.isFree ? 'default' : 'outline'}
                size="lg"
                onClick={() => navigate('/auth')}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <p className="text-center text-muted-foreground mt-12">
          💰 30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
