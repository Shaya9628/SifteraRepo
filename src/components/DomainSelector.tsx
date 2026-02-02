import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Check } from 'lucide-react';
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
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        {showDescription && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {GLOBAL_DOMAINS.map((domain) => (
          <Card 
            key={domain.value}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedDomain === domain.value 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onDomainSelect(domain.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{domain.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{domain.label}</h3>
                  </div>
                </div>
                {selectedDomain === domain.value && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDomain && (
        <div className="text-center">
          <Badge variant="secondary" className="text-sm">
            Selected: {GLOBAL_DOMAINS.find(d => d.value === selectedDomain)?.label}
          </Badge>
        </div>
      )}
      
      {showDescription && (
        <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> You can change your domain later in your profile settings. 
            Your domain selection will determine the questions and evaluation criteria used 
            during assessments.
          </p>
        </div>
      )}
    </div>
  );
};