export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function calculateBMR({ weightKg, heightCm, age, gender }) {
  if (!weightKg || !heightCm || !age) return null;

  // Mifflin-St Jeor estimate. This is a general estimate, not a diagnosis.
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === "male") bmr += 5;
  else if (gender === "female") bmr -= 161;
  else bmr -= 78;

  return Math.round(bmr);
}

export function calculateTDEE(bmr, activityLevel) {
  if (!bmr) return null;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725
  };

  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
}

export function calculateHealthMetrics(profile) {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  return { bmi, bmr, tdee };
}
