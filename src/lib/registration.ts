export type RegistrationFields = {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  password: string;
  confirmation: string;
};

export function getPasswordRules(password: string) {
  return {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-./]/.test(password),
  };
}

export function getPasswordMatch(password: string, confirmation: string): "neutral" | "valid" | "invalid" {
  if (!password || !confirmation) return "neutral";
  return password === confirmation ? "valid" : "invalid";
}

export function validateRegistration(fields: RegistrationFields) {
  const passwordRules = getPasswordRules(fields.password);
  const passwordMatch = getPasswordMatch(fields.password, fields.confirmation);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim());
  const errors: string[] = [];

  if (fields.firstName.trim().length < 2) errors.push("Le prénom doit contenir au moins 2 caractères.");
  if (fields.lastName.trim().length < 2) errors.push("Le nom doit contenir au moins 2 caractères.");
  if (fields.nickname.trim() && fields.nickname.trim().length < 2) {
    errors.push("Le pseudo doit faire au moins 2 caractères.");
  }
  if (!isValidEmail) errors.push("Renseigne une adresse email valide.");
  if (!passwordRules.minLength) errors.push("Mot de passe trop court (min 6 caractères).");
  if (!passwordRules.hasUpperCase) errors.push("Ajoute au moins une majuscule.");
  if (!passwordRules.hasNumber) errors.push("Ajoute au moins un chiffre.");
  if (!passwordRules.hasSpecialChar) errors.push("Ajoute un caractère spécial (!@#$%...).");
  if (passwordMatch !== "valid") errors.push("Les mots de passe ne correspondent pas.");

  return { passwordRules, passwordMatch, isValidEmail, errors, isValid: errors.length === 0 };
}
