import { Check } from "lucide-react";

const STEPS = ["Job Details", "Services", "Review Invoice"] as const;

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div
            key={label}
            className={[
              "flex items-center",
              index < STEPS.length - 1 ? "flex-1" : "",
            ].join(" ")}
          >
            {/* Circle + label */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isCompleted
                    ? "bg-[#0077B6] text-white"
                    : isActive
                    ? "bg-[#0077B6] text-white ring-4 ring-[#0077B6]/20"
                    : "bg-muted text-muted-foreground border-2 border-border",
                ].join(" ")}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span
                className={[
                  "mt-1.5 text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[64px]",
                  isActive
                    ? "text-[#0077B6] font-semibold"
                    : isCompleted
                    ? "text-[#0077B6]"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {index < STEPS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-2 mt-[-18px] rounded-full transition-colors",
                  isCompleted ? "bg-[#0077B6]" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
