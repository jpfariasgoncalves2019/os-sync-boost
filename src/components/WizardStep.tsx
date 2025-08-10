import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WizardStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  isNextDisabled?: boolean;
  showStepIndicator?: boolean;
}

export function WizardStep({
  title,
  description,
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  nextLabel = "Próximo",
  previousLabel = "Anterior", 
  isNextDisabled = false,
  showStepIndicator = true,
}: WizardStepProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {showStepIndicator && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Passo {currentStep} de {totalSteps}
            </span>
          </div>
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < currentStep
                    ? "bg-primary"
                    : index === currentStep - 1
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {previousLabel}
            </Button>

            <Button
              onClick={onNext}
              disabled={isNextDisabled}
              className="flex items-center gap-2"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}