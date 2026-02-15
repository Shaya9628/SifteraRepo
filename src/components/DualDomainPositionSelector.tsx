import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Domain, GLOBAL_DOMAINS } from '@/lib/constants/domains';
import { DOMAIN_POSITIONS, Position, getPositionsForDomain } from '@/lib/constants/positions';
import { ChevronRight, Sparkles, Briefcase, TrendingUp, Check } from 'lucide-react';

interface DualDomainPositionSelectorProps {
  selectedDomain: Domain | null;
  selectedPosition: string | null;
  onDomainSelect: (domain: Domain) => void;
  onPositionSelect: (position: string) => void;
  onComplete?: (domain: Domain, position: string) => void;
  className?: string;
}

export const DualDomainPositionSelector: React.FC<DualDomainPositionSelectorProps> = ({
  selectedDomain,
  selectedPosition,
  onDomainSelect,
  onPositionSelect,
  onComplete,
  className = '',
}) => {
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [showPositions, setShowPositions] = useState(false);

  useEffect(() => {
    if (selectedDomain) {
      const positions = getPositionsForDomain(selectedDomain);
      setAvailablePositions(positions);
      setShowPositions(true);
    } else {
      setAvailablePositions([]);
      setShowPositions(false);
    }
  }, [selectedDomain]);

  const handleDomainClick = (domain: Domain) => {
    onDomainSelect(domain);
    onPositionSelect(''); // Reset position when domain changes
  };

  const handlePositionClick = (position: string) => {
    onPositionSelect(position);
    if (onComplete && selectedDomain) {
      onComplete(selectedDomain, position);
    }
  };

  const getPositionIcon = (level: 'junior' | 'mid' | 'senior' | 'executive') => {
    switch (level) {
      case 'junior': return '🌱';
      case 'mid': return '📈';
      case 'senior': return '🎯';
      case 'executive': return '👑';
      default: return '💼';
    }
  };

  const getLevelColor = (level: 'junior' | 'mid' | 'senior' | 'executive') => {
    switch (level) {
      case 'junior': return 'from-green-400 to-emerald-500';
      case 'mid': return 'from-blue-400 to-cyan-500';
      case 'senior': return 'from-purple-400 to-pink-500';
      case 'executive': return 'from-orange-400 to-red-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-white/20">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-gradient-neon animate-gradient">
            Assessment Configuration
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gradient-neon animate-gradient">
          Which Domain and which position you are assessing the resume?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select the domain area and specific position level to get targeted assessment questions
        </p>
      </div>

      {/* Step 1: Domain Selection */}
      <Card className="glass-strong border-2 border-white/10 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Step 1: Choose Domain</CardTitle>
              <p className="text-sm text-muted-foreground">Select the industry or functional area</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {GLOBAL_DOMAINS.map(domain => (
              <Card
                key={domain.value}
                className={`
                  cursor-pointer transition-all duration-300 border-2 hover-lift
                  ${selectedDomain === domain.value
                    ? 'glass-strong border-neon-purple glow-purple scale-105'
                    : 'glass border-white/20 hover:border-neon-purple/50 hover:scale-102'
                  }
                `}
                onClick={() => handleDomainClick(domain.value)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2 emoji-pop">
                    {domain.icon}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {domain.label}
                  </div>
                  {selectedDomain === domain.value && (
                    <div className="mt-2">
                      <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/50 animate-glow-pulse">
                        Selected
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Position Selection */}
      {showPositions && (
        <Card className="glass-strong border-2 border-white/10 overflow-hidden animate-slide-up">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-pink">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Step 2: Choose Position Level</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the specific job level for {GLOBAL_DOMAINS.find(d => d.value === selectedDomain)?.label}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-neon-purple animate-bounce-slow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availablePositions.map((position, index) => (
                <Card
                  key={position.value}
                  className={`
                    cursor-pointer transition-all duration-300 border-2 hover-lift
                    ${selectedPosition === position.value
                      ? 'glass-strong border-neon-cyan glow-cyan scale-102'
                      : 'glass border-white/20 hover:border-neon-cyan/50 hover:scale-101'
                    }
                    animate-fade-in
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handlePositionClick(position.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${getLevelColor(position.level)}`}>
                        <span className="text-lg">{getPositionIcon(position.level)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{position.label}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            className={`text-xs bg-gradient-to-r ${getLevelColor(position.level)} border-0 text-white`}
                          >
                            {position.level.charAt(0).toUpperCase() + position.level.slice(1)}
                          </Badge>
                          {position.yearRange && (
                            <span className="text-xs text-muted-foreground">{position.yearRange}</span>
                          )}
                        </div>
                      </div>
                      {selectedPosition === position.value && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 animate-glow-pulse">
                            Selected
                          </Badge>
                          <Check className="w-4 h-4 text-neon-cyan" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedDomain && selectedPosition && (
        <Card className="glass-strong border-2 border-neon-purple glow-purple animate-scale-in">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-purple animate-spin" />
                <span className="text-lg font-semibold text-gradient-neon animate-gradient">
                  Assessment Ready!
                </span>
                <Sparkles className="w-5 h-5 text-neon-purple animate-spin" />
              </div>
              <div className="p-4 rounded-xl glass border border-white/20">
                <div className="text-sm text-muted-foreground mb-2">Assessing for:</div>
                <div className="text-lg font-bold text-white">
                  {availablePositions.find(p => p.value === selectedPosition)?.label}
                </div>
                <div className="text-sm text-neon-cyan mt-1">
                  in {GLOBAL_DOMAINS.find(d => d.value === selectedDomain)?.label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};