import { Check, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
}

interface AssessmentStepperProps {
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export const AssessmentStepper = ({ currentStep, completedSteps, className }: AssessmentStepperProps) => {
  const steps: AssessmentStep[] = [
    {
      id: 'scorecard',
      label: 'Resume Screening',
      description: 'Evaluate candidate qualifications',
    },
    {
      id: 'red_flags',
      label: 'Red Flags Detection',
      description: 'Identify potential concerns',
    },
    {
      id: 'screening_calls',
      label: 'Screening Call',
      description: 'Conduct behavioral assessment',
    }
  ].map(step => ({
    ...step,
    status: completedSteps.includes(step.id) 
      ? 'completed' as const
      : currentStep === step.id 
        ? 'current' as const 
        : 'pending' as const
  }));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  step.status === 'completed' && "bg-primary border-primary text-primary-foreground",
                  step.status === 'current' && "border-primary bg-primary/10 text-primary",
                  step.status === 'pending' && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : step.status === 'current' ? (
                  <CircleDot className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              
              {/* Step labels */}
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    step.status === 'completed' && "text-primary",
                    step.status === 'current' && "text-primary",
                    step.status === 'pending' && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-4 transition-colors",
                  step.status === 'completed' ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile-friendly current step indicator */}
      <div className="mt-4 sm:hidden">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-center">
            Current Step: {steps.find(s => s.status === 'current')?.label || 'Assessment Complete'}
          </p>
          {steps.find(s => s.status === 'current')?.description && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {steps.find(s => s.status === 'current')?.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};