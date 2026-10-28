export interface PasswordStrength {
  /** 0 (empty) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

/** A quick heuristic for the strength meter - length plus character variety. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '' }
  let points = 0
  if (password.length >= 8) points++
  if (password.length >= 12) points++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++
  if (/\d/.test(password)) points++
  if (/[^A-Za-z0-9]/.test(password)) points++
  const score = Math.max(1, Math.min(4, points - (password.length < 8 ? 1 : 0))) as PasswordStrength['score']
  return { score, label: LABELS[score] }
}
