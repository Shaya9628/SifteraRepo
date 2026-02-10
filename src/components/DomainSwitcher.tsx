import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';

type Domain = 'Sales' | 'CRM';

interface DomainSwitcherProps {
  currentDomain: Domain;
  onDomainChange: (domain: Domain) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

const DOMAIN_INFO = {
  Sales: {
    label: 'Sales',
    icon: Building2,
    color: 'bg-blue-500 text-white',
    description: 'Sales processes, lead management, and revenue generation'
  },
  CRM: {
    label: 'Customer Relationship Management', 
    icon: Users,
    color: 'bg-green-500 text-white',
    description: 'Customer service, support, and relationship management'
  }
};

export const DomainSwitcher: React.FC<DomainSwitcherProps> = ({
  currentDomain,
  onDomainChange,
  disabled = false,
  showDescription = true,
}) => {
  const currentDomainInfo = DOMAIN_INFO[currentDomain];
  const Icon = currentDomainInfo.icon;

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
            <Badge className={currentDomainInfo.color}>
              <Icon className="h-4 w-4 mr-2" />
              {currentDomainInfo.label}
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
              <SelectItem value="Sales">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Sales
                </div>
              </SelectItem>
              <SelectItem value="CRM">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  CRM
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showDescription && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{currentDomainInfo.label}:</strong> {currentDomainInfo.description}
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