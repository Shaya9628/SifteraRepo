import { X, Check } from 'lucide-react';

const ProblemSolution = () => {
  const problems = [
    'Inconsistent screening criteria across your team',
    'New hires take months to train effectively',
    'No way to track screening accuracy or improvement',
    'Subjective decisions leading to missed talent',
  ];

  const solutions = [
    'Start free with two resume uploads—no commitment required',
    'AI + Human dual scoring for improved accuracy',
    'Side-by-side comparison with AI-powered insights',
    'Real-time analytics to track screening performance',
  ];

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Stop Wasting Hours on{' '}
            <span className="text-destructive">Inconsistent</span> Resume Screening
          </h2>
          <p className="text-xl text-muted-foreground">
            Transform your hiring process from guesswork to precision with structured training.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problems */}
          <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-destructive">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="w-4 h-4" />
              </div>
              Without Siftera
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-destructive" />
                  </div>
                  <span className="text-muted-foreground">{problem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              With Siftera
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
