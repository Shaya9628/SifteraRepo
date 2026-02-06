import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { GLOBAL_DOMAINS, type Domain } from '@/lib/constants/domains';

interface DomainSelectorProps {
  selectedDomain: Domain;
  onDomainSelect: (domain: Domain) => void;
  title?: string;
  description?: string;
  showDescription?: boolean;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  selectedDomain,
  onDomainSelect,
  title = "Choose Your Domain",
  description = "Select the domain that best matches your role and responsibilities",
  showDescription = true,
}) => {
  return (
    <div className="space-y-6">
      {title && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gradient">{title}</h2>
          {showDescription && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
        {GLOBAL_DOMAINS.map((domain) => (
          <Card 
            key={domain.value}
            className={`cursor-pointer transition-all duration-300 card-hover group ${
              selectedDomain === domain.value 
                ? 'border-2 border-primary bg-primary/10 glow-purple scale-105' 
                : 'border-2 border-border/50 hover:border-primary/50 glass'
            }`}
            onClick={() => onDomainSelect(domain.value)}
          >
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-3xl emoji-pop group-hover:scale-125 transition-transform duration-300">
                  {domain.icon}
                </span>
                <h3 className="font-semibold text-xs leading-tight">{domain.label}</h3>
                {selectedDomain === domain.value && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDomain && (
        <div className="flex justify-center">
          <Badge className="bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {GLOBAL_DOMAINS.find(d => d.value === selectedDomain)?.label}
          </Badge>
        </div>
      )}
      
      {showDescription && (
        <div className="glass p-4 rounded-2xl text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="emoji-pop">💡</span>
            <span>
              <strong>Pro tip:</strong> You can switch domains anytime from settings. 
              Your domain affects the questions and evaluation criteria in assessments.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};