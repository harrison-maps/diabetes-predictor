# 🩺 DiabetesRisk :Cloud-Based Diabetes Risk Prediction System

> **Makerere University · Cloud Computing Coursework Project**  
> BSc Computer Science · Ssempala Harrison Solomon

A cloud-hosted diabetes risk prediction system demonstrating **IaaS, PaaS, and SaaS** cloud service models, powered by a trained **Soft Voting Ensemble** (Logistic Regression + Random Forest + Neural Network).

**🔗 Live Demo:** `https://<harrison-maps>.github.io/diabetes-predictor/`

---

## 🏗 Architecture at a Glance

| Layer | Role in This System | Technology |
|-------|---------------------|------------|
| **SaaS** | Patient web app — browser-based, zero install | GitHub Pages + CDN |
| **PaaS** | API server for RF + MLP ensemble extension | Render / Cloudflare Workers |
| **IaaS** | VM hosting ML model + object storage for .pkl files | GCP / AWS |

---

## 🚀 Deploy to GitHub Pages (5 minutes)

### Step 1 — Create the repository
```bash
git init
git add .
git commit -m "Initial commit: DiabetesRisk prediction system"
```

### Step 2 — Push to GitHub
```bash
# Create a new repo on github.com first, then:
git remote add origin https://github.com/<your-username>/diabetes-predictor.git
git branch -M main
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. The workflow in `.github/workflows/deploy.yml` runs automatically on every push
5. Your site is live at: `https://<your-username>.github.io/diabetes-predictor/`

That's it. No server configuration, no environment variables, no cold starts.

---

## 🧠 How the Model Works (Client-Side)

The trained `log_model.pkl` (Logistic Regression) has been converted to pure JavaScript:

```
User Input (8 fields)
    ↓ Zero imputation (replace 0s with dataset medians)
    ↓ Feature engineering (8 → 15 features, 7 interaction terms)
    ↓ StandardScaler normalisation (μ=0, σ=1)
    ↓ LR inference: sigmoid(X · coef + intercept)
    → Probability score → Risk level (Low / Borderline / Moderate / High)
```

**Key insight:** Logistic Regression is just matrix multiplication + sigmoid.  
The coefficients and scaler parameters are embedded directly in `js/model.js`,  
so the entire ML pipeline runs in the browser with **zero server latency**.

---

## 📁 Project Structure

```
diabetes-predictor/
├── index.html                    # Main web application
├── css/
│   └── style.css                 # Full stylesheet
├── js/
│   ├── model.js                  # Trained LR model (coefficients + scaler + inference)
│   └── app.js                    # UI controller (form, history, charts)
├── .github/
│   └── workflows/
│       └── deploy.yml            # Auto-deploy to GitHub Pages on push
└── README.md
```

---

## 🔬 Model Details

| Property | Value |
|----------|-------|
| Model type | Logistic Regression (scikit-learn) |
| Training data | Pima Indians Diabetes Dataset (768 records) |
| Input features | 15 (8 original + 7 interaction terms) |
| Regularisation | L2 (C=1.0) |
| Class weighting | `balanced` (corrects for ~65/35 imbalance) |
| Solver | `lbfgs` |
| Test accuracy | ~72% |
| File | `log_model.pkl` |

### Feature Engineering (8 → 15)

| # | Feature | Type |
|---|---------|------|
| 0 | Pregnancies | Original |
| 1 | Glucose | Original |
| 2 | BloodPressure | Original |
| 3 | SkinThickness | Original |
| 4 | Insulin | Original |
| 5 | BMI | Original |
| 6 | DiabetesPedigreeFunction | Original |
| 7 | Age | Original |
| 8 | Glucose × BMI | Engineered |
| 9 | Glucose × Age | Engineered |
| 10 | BMI × Age | Engineered |
| 11 | Pregnancies × Age | Engineered |
| 12 | Glucose × Insulin | Engineered |
| 13 | Insulin × BMI | Engineered |
| 14 | Pregnancies × Glucose | Engineered |

---

## 📊 Ensemble Extension (Future / PaaS)

To deploy the full **Soft Voting Ensemble** (LR + RF + MLP):

### Option A — Cloudflare Workers (Recommended)
```bash
npm install -g wrangler
wrangler init diabetes-api
# Deploy Python via Pyodide or Node.js port of the model
wrangler deploy
```
Free tier: **100,000 requests/day**, **0ms cold start** globally.

### Option B — Render (Free tier)
- Sleeps after 15 min of inactivity (cold start ~30s on free tier)
- Upgrade to $7/mo paid tier to avoid cold starts

### Option C — Hugging Face Spaces
- Free FastAPI/Gradio hosting
- Good for demos, not production

---

## 🔒 Security Notes

- No patient data is sent to any server (LR runs client-side)
- Prediction history is stored in `sessionStorage` only (cleared on tab close)
- No authentication required for the GitHub Pages deployment

---

## ⚠ Disclaimer

This tool is for **educational and research purposes only**.  
It does not constitute medical advice or a clinical diagnosis.  
Always consult a licensed healthcare professional for medical evaluation.

---

## 📄 Citation

If referencing this project:

> S. Harry, "Cloud-Based Diabetes Risk Prediction System," Cloud Computing Coursework Project, Makerere University, College of Computing and Information Sciences, June 2026.
