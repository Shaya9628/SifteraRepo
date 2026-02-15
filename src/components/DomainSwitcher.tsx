import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { Domain, GLOBAL_DOMAINS } from '@/lib/constants/domains';

interface DomainSwitcherProps {
  currentDomain: Domain;
  onDomainChange: (domain: Domain) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

export const DomainSwitcher: React.FC<DomainSwitcherProps> = ({
  currentDomain,
  onDomainChange,
  disabled = false,
  showDescription = true,
}) => {
  const currentDomainInfo = GLOBAL_DOMAINS.find(d => d.value === currentDomain);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Current Domain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground">
              <span className="text-lg mr-2">{currentDomainInfo?.icon}</span>
              {currentDomainInfo?.label}
            </Badge>
          </div>
          
          <Select 
            value={currentDomain} 
            onValueChange={(val) => onDomainChange(val as Domain)}
            disabled={disabled}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GLOBAL_DOMAINS.map((domain) => (
                <SelectItem key={domain.value} value={domain.value}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{domain.icon}</span>
                    <span className="text-sm">{domain.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showDescription && currentDomainInfo && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{currentDomainInfo.label}:</strong> Professional assessment and training focused on {currentDomainInfo.label.toLowerCase()} expertise.
            </p>
          </div>
        )}

        {disabled && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              Domain switching is currently disabled by your administrator.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};