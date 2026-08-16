"use client";

import { Check } from "lucide-react";

interface Step {
  title: string;
  subtitle: string;
}

interface WizardStepperProps {
  steps: Step[];
  activeStep: number;
  locale: string;
}

export default function WizardStepper({
  steps,
  activeStep,
  locale,
}: WizardStepperProps) {
  const isRTL = locale === "ar";

  return (
    <div className="w-full py-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="relative flex items-start justify-between">
        <div
          className="absolute bg-gray-200"
          style={{
            top: "20px",
            left: "5%",
            right: "5%",
            height: "2px",
            zIndex: 0,
          }}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(activeStep / (steps.length - 1)) * 100}%`,
              transformOrigin: isRTL ? "right" : "left",
              marginLeft: isRTL ? "auto" : "0",
              marginRight: isRTL ? "0" : "auto",
            }}
          />
        </div>

        {steps.map((step, displayIndex) => {
          const isActive = displayIndex === activeStep;
          const isCompleted = displayIndex < activeStep;

          return (
            <div
              key={step.title}
              className="relative flex flex-1 flex-col items-center"
            >
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isActive
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "border-2 border-gray-300 bg-white text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{displayIndex + 1}</span>
                )}
              </div>

              <div className="mt-3 max-w-[120px] text-center">
                <div
                  className={`text-sm font-semibold transition-colors ${
                    isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {step.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
