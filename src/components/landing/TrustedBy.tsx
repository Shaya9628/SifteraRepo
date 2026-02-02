const TrustedBy = () => {
  const companies = [
    'TechCorp',
    'InnovateCo',
    'GlobalHR',
    'TalentFirst',
    'HireSmart',
    'PeopleOps',
  ];

  return (
    <section className="py-16 border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">
          Trusted by HR teams at leading companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {companies.map((company, index) => (
            <div
              key={index}
              className="text-2xl font-bold text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
