/**
 * Password Validation Utility
 *
 * Requirements:
 * - Minimum 12 characters (increased from 8 for better security)
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  // Check minimum length
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_RULES.minLength} characters`
    );
  } else {
    strengthScore++;
    if (password.length >= 12) strengthScore++;
  }

  // Check uppercase
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least 1 uppercase letter");
  } else {
    strengthScore++;
  }

  // Check lowercase
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least 1 lowercase letter");
  } else {
    strengthScore++;
  }

  // Check number
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least 1 number");
  } else {
    strengthScore++;
  }

  // Check special character
  if (PASSWORD_RULES.requireSpecial && !SPECIAL_CHARS.test(password)) {
    errors.push(
      "Password must contain at least 1 special character (!@#$%^&*...)"
    );
  } else {
    strengthScore++;
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak";
  if (strengthScore >= 5) strength = "strong";
  else if (strengthScore >= 3) strength = "medium";

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Zod refinement for password validation
 * Use with: z.string().refine(isStrongPassword, { message: 'Password is too weak' })
 */
export function isStrongPassword(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Get password validation error message for Zod
 */
export function getPasswordErrorMessage(password: string): string {
  const result = validatePassword(password);
  return result.errors[0] || "Invalid password";
}
