import { Building2, Briefcase, Users, Globe, Award, Target } from 'lucide-react';

const TrustedBy = () => {
  const companies = [
    { name: 'Microsoft', icon: Building2 },
    { name: 'Deloitte', icon: Briefcase },
    { name: 'Infosys', icon: Globe },
    { name: 'TCS', icon: Users },
    { name: 'Accenture', icon: Award },
    { name: 'Wipro', icon: Target },
  ];

  return (
    <section className="py-12 md:py-16 border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">
          Trusted by HR teams at leading companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 lg:gap-16">
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-muted-foreground/50 hover:text-primary transition-colors duration-300 group cursor-default"
            >
              <company.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-lg md:text-xl font-bold tracking-tight">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
