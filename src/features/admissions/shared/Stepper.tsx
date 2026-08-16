// FILE: src/components/admissions/Stepper.tsx

import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isCurrent
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-gray-900"
                          : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-8">
                  <div
                    className={`h-full transition-colors ${
                      index < currentStep ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
