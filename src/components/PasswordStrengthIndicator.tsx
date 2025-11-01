import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements: PasswordRequirement[] = [
    {
      label: "At least 12 characters",
      met: password.length >= 12,
    },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ];

  const metRequirements = requirements.filter((r) => r.met).length;
  const strength = (metRequirements / requirements.length) * 100;

  const getStrengthLabel = () => {
    if (metRequirements === 0) return "";
    if (metRequirements <= 2) return "Weak";
    if (metRequirements <= 3) return "Fair";
    if (metRequirements <= 4) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (metRequirements <= 2) return "bg-destructive";
    if (metRequirements <= 3) return "bg-warning";
    if (metRequirements <= 4) return "bg-info";
    return "bg-success";
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span className={`font-medium ${
            metRequirements <= 2 ? "text-destructive" :
            metRequirements <= 3 ? "text-warning" :
            metRequirements <= 4 ? "text-info" :
            "text-success"
          }`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">Password must have:</p>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={req.met ? "text-success" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 12) {
    return { isValid: false, message: "Password must be at least 12 characters" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain an uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain a lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain a number" };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: "Password must contain a special character" };
  }
  
  return { isValid: true };
}
