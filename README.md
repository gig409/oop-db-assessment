# OOP & Databases Assessment App

An AI-powered formative assessment tool for OCR Computer Science (H046/H446) covering OOP and Databases. 26 questions, 89 marks. AI feedback on every answer using the official mark scheme.

## Deployment to Cloudflare Pages

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/oop-db-assessment.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select your repository
4. Build settings:
   - **Framework preset**: None
   - **Build command**: *(leave blank)*
   - **Build output directory**: `/` (root)
5. Click **Save and Deploy**

### 3. Add the Anthropic API Key

1. Go to your Pages project → **Settings** → **Environment variables**
2. Add a variable for **Production** (and optionally Preview):
   - **Variable name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-...` (your key from [console.anthropic.com](https://console.anthropic.com))
3. Click **Save**
4. Trigger a new deployment (Settings → Deployments → Retry deployment)

That's it. Your assessment is live at `https://YOUR_PROJECT.pages.dev`

---

## Project Structure

```
├── index.html                  # Full single-page assessment app
├── functions/
│   └── api/
│       └── feedback.js         # Cloudflare Pages Function (API proxy)
└── README.md
```

The `functions/api/feedback.js` file is automatically detected by Cloudflare Pages and deployed as a serverless function at `/api/feedback`. It proxies calls to the Anthropic API, keeping your API key secret.

---

## How It Works

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML/CSS/JS (single file) |
| AI Feedback | Claude claude-sonnet-4-20250514 via Anthropic API |
| API Proxy | Cloudflare Pages Function |
| State | `sessionStorage` (per browser session) |

### Feedback flow
1. Student writes answer and clicks **Get AI Feedback**
2. Browser POSTs to `/api/feedback` (the Pages Function)
3. Pages Function calls Anthropic API with the question, mark scheme, and student answer
4. Claude grades the answer against the OCR mark scheme and returns structured JSON
5. Frontend renders mark, strengths, improvements, and a hint

### Local validation
A few short factual questions (data types, Boolean fields, foreign keys) are validated instantly in the browser without an API call.

---

## Running Locally

For local development, use [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
npm install -g wrangler
wrangler pages dev . --binding ANTHROPIC_API_KEY=sk-ant-...
```

Or, open `index.html` directly in a browser and enter your API key in the setup screen (it will call the Anthropic API directly from your browser).

---

## Assessment Coverage

| Section | Questions | Marks |
|---------|-----------|-------|
| Databases (ERD, normalisation, SQL, keys) | 13 | 40 |
| OOP (classes, methods, arrays, debugging) | 13 | 49 |
| **Total** | **26** | **89** |

Questions from OCR Computer Science H046/H446 — OOP & Databases topic area.
