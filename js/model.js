// ============================================================
// model.js  —  Trained Logistic Regression (log_model.pkl)
// Reconstructed scaler from Pima Indians Diabetes Dataset
// All inference runs 100% client-side, zero server needed.
// ============================================================

const DiabetesModel = (() => {

  // StandardScaler parameters (fit on Pima training split, random_state=42)
  const SCALER_MEAN = [
    3.8192182410423454, 121.67100977198697, 72.1400651465798,
    29.042345276872965, 137.70521172638436, 32.44674267100976,
    0.47742833876221474, 33.36644951140065,
    3954.8012164471595, 4082.1623833254455, 1089.6397449979584,
    130.63930885529157, 17375.74893613478, 4451.777716466929,
    470.4501628664495
  ];
  const SCALER_SCALE = [
    3.310521027920844, 29.979257498399455, 12.265099380617543,
    8.884622823871327, 78.70112042636085, 6.818988100523022,
    0.33018477040476186, 11.824237660218874,
    1246.4696527025617, 1487.408688397048, 428.6978561682254,
    144.3494694044079, 7834.453014213166, 2900.1476680682887,
    1399.2975540038416
  ];

  // Logistic Regression coefficients extracted from log_model.pkl
  const LR_COEF = [
    1.01955065173346, 0.17504107125143392, -0.031469270525748286,
    0.5798935821950579, -0.0643475216484878, -0.05354359164029474,
    -0.2880727237299838, -0.012929160201857966, 0.15835023800045345,
    0.07979519068638856, 0.0414591889898929, -0.1687789683891775,
    0.24711521122717484, -0.1385331811692612, 0.10885659024807723
  ];
  const LR_INTERCEPT = -0.027854200322407433;

  const FEATURE_NAMES = [
    'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin',
    'BMI', 'DiabetesPedigreeFunction', 'Age',
    'Glucose×BMI', 'Glucose×Age', 'BMI×Age', 'Pregnancies×Age',
    'Glucose×Insulin', 'Insulin×BMI', 'Pregnancies×Glucose'
  ];

  // Column medians for zero-value imputation (same as training)
  const MEDIANS = [3, 117, 72, 23, 30.5, 32.0, 0.3725, 29];
  const IMPUTE_IDX = [1, 2, 3, 4, 5]; // Glucose, BP, Skin, Insulin, BMI

  function engineerFeatures(r) {
    const [preg, gluc, bp, skin, ins, bmi, dpf, age] = r;
    return [
      preg, gluc, bp, skin, ins, bmi, dpf, age,
      gluc * bmi,   // Glucose_BMI
      gluc * age,   // Glucose_Age
      bmi  * age,   // BMI_Age
      preg * age,   // Pregnancies_Age
      gluc * ins,   // Glucose_Insulin
      ins  * bmi,   // Insulin_BMI
      preg * gluc   // Pregnancies_Glucose
    ];
  }

  function scaleFeatures(f) {
    return f.map((v, i) => (v - SCALER_MEAN[i]) / SCALER_SCALE[i]);
  }

  function sigmoid(z) {
    return 1.0 / (1.0 + Math.exp(-z));
  }

  function lrInfer(scaled) {
    let z = LR_INTERCEPT;
    for (let i = 0; i < scaled.length; i++) z += scaled[i] * LR_COEF[i];
    const p1 = sigmoid(z);
    return { prob0: 1 - p1, prob1: p1 };
  }

  function getRiskLevel(p) {
    if (p < 0.35) return { level: 'Low',        label: 'Low Risk',      emoji: '✓', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' };
    if (p < 0.55) return { level: 'Borderline', label: 'Borderline',    emoji: '◐', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' };
    if (p < 0.70) return { level: 'Moderate',   label: 'Moderate Risk', emoji: '⚠', color: '#f97316', bg: '#fff7ed', border: '#fdba74' };
    return              { level: 'High',        label: 'High Risk',     emoji: '✕', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' };
  }

  const RECOMMENDATIONS = {
    Low:        'Your health indicators suggest a low risk for diabetes. Keep up your healthy habits — regular physical activity, balanced meals, and annual check-ups will help maintain this.',
    Borderline: 'Some indicators are slightly outside optimal ranges. Consider consulting a healthcare provider for a formal glucose tolerance test. Reducing refined sugar intake and increasing exercise can significantly lower your risk.',
    Moderate:   'Multiple risk factors are elevated. A physician visit for formal diabetes screening is strongly recommended. Regular blood glucose monitoring, dietary adjustments, and consistent exercise are important next steps.',
    High:       'Your profile includes several high-risk indicators for diabetes. Please seek prompt medical evaluation for comprehensive screening. Early clinical intervention significantly improves long-term outcomes.'
  };

  function predict(rawInputs) {
    // rawInputs: [pregnancies, glucose, bloodPressure, skinThickness, insulin, bmi, dpf, age]
    const imputed = rawInputs.map((v, i) =>
      (IMPUTE_IDX.includes(i) && (v === 0 || isNaN(v))) ? MEDIANS[i] : v
    );
    const engineered  = engineerFeatures(imputed);
    const scaled      = scaleFeatures(engineered);
    const { prob0, prob1 } = lrInfer(scaled);
    const risk        = getRiskLevel(prob1);
    const contributions = LR_COEF.map((c, i) => ({
      name:  FEATURE_NAMES[i],
      value: scaled[i] * c
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return {
      probDiabetic:    Math.round(prob1 * 1000) / 1000,
      probHealthy:     Math.round(prob0 * 1000) / 1000,
      riskLevel:       risk.level,
      riskLabel:       risk.label,
      riskEmoji:       risk.emoji,
      riskColor:       risk.color,
      riskBg:          risk.bg,
      riskBorder:      risk.border,
      recommendation:  RECOMMENDATIONS[risk.level],
      topContributors: contributions.slice(0, 5),
      allContributions: contributions
    };
  }

  return { predict, getRiskLevel, FEATURE_NAMES };
})();

if (typeof module !== 'undefined') module.exports = DiabetesModel;
