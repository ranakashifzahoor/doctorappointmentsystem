# Deploying Prescrip

Three pieces are deployed separately:

| Piece | Folder | Host | Type |
|---|---|---|---|
| Patient website | `frontend/` | Vercel | static (Vite) |
| Doctor panel | `admin/` | Vercel | static (Vite) |
| API (Express + MongoDB) | `backend/` | Vercel | serverless function |

The unified portal (`portal/`) is a local-development convenience; it can stay local or be added as a 4th static site.

---

## 1. What you must supply (I cannot create these for you)

| # | Service | Credential | Where it goes | Why |
|---|---|---|---|---|
| 1 | **GitHub** | Personal Access Token (classic, scope `repo`) — <https://github.com/settings/tokens> | paste it to me, or run `git push` yourself | to create/push the repository |
| 2 | **Vercel** | Account token — <https://vercel.com/account/tokens> | paste it to me, or run `npx vercel login` | to create the projects and deploy |
| 3 | **MongoDB Atlas** | Connection string `mongodb+srv://user:pass@cluster/…` — free tier at <https://cloud.mongodb.com> | Vercel → API project → Settings → Environment Variables → `MONGODB_URI` | **Required.** Vercel cannot reach a MongoDB running on your PC, so the deployed API needs a cloud database |
| 4 | *Optional* Cloudinary | Cloud name + API key + secret | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY` | Vercel's filesystem is read-only/ephemeral, so uploaded photos need cloud storage |

> Nothing is deployed with secret keys hardcoded — `.env` files are git-ignored and every key is set in the host's dashboard.

---

## 2. Push to GitHub

```powershell
cd D:\doctor
git init
git add .
git commit -m "Prescrip - doctor appointment booking system (patient + doctor panels)"
git branch -M main
git remote add origin https://github.com/<your-username>/prescrip.git
git push -u origin main
```

With a token (no prompts):

```powershell
git remote set-url origin https://<TOKEN>@github.com/<your-username>/prescrip.git
git push -u origin main
```

Create the empty repo first (or let me create it via the GitHub API once you give me the token).

---

## 3. Deploy the API (Vercel project #1)

```powershell
cd D:\doctor\backend
npx vercel --prod            # choose: new project, name e.g. prescrip-api, root = ./
```

After the first deploy, add the environment variables in
**Vercel → prescrip-api → Settings → Environment Variables**:

```
MONGODB_URI=mongodb+srv://…
JWT_SECRET=<any long random string>
ADMIN_EMAIL=admin@prescrip.com
ADMIN_PASSWORD=<your admin password>
PAYMENT_DEMO=true
PAYMENT_CURRENCY=PKR
BACKEND_URL=https://prescrip-api.vercel.app
```

Then redeploy (`npx vercel --prod` again) and check
`https://prescrip-api.vercel.app/api/health`.

`backend/vercel.json` already rewrites every path to the serverless entry (`api/index.js`),
and `backend/app.js` holds the Express app so the same code runs locally (`npm run dev`) and on Vercel.

---

## 4. Deploy the two front-ends (Vercel projects #2 and #3)

```powershell
cd D:\doctor\frontend
npx vercel --prod            # new project, name e.g. prescrip-patient
# then set: VITE_BACKEND_URL = https://prescrip-api.vercel.app   (all environments)
npx vercel --prod            # redeploy so the value is baked in

cd D:\doctor\admin
npx vercel --prod            # new project, name e.g. prescrip-doctor
# then set: VITE_BACKEND_URL = https://prescrip-api.vercel.app
npx vercel --prod
```

`frontend/vercel.json` and `admin/vercel.json` add the SPA rewrite so client-side routes
(`/doctors`, `/appointment/:id`, `/doctor/dashboard`, …) work on refresh.
`VITE_*` values are read at **build** time — change them and redeploy.

---

## 5. Seed the cloud database

Once `MONGODB_URI` points at Atlas, seed it from your machine:

```powershell
cd D:\doctor\backend
$env:MONGODB_URI="mongodb+srv://…"
npm run db:reset
```

---

## 6. Post-deploy notes / limitations

- **Uploads** go to Vercel's ephemeral storage unless Cloudinary is configured — set the Cloudinary keys for persistent images.
- **Vercel body limit** is ~4.5 MB per request; doctor/patient photos are well under that.
- **Payments** run in demo mode (`PAYMENT_DEMO=true`) unless you add real gateway keys.
- The seeded doctor photos (`backend/uploads/*.jpg`) are committed, so the demo data renders fine after deploy.
- Free Vercel projects sleep on inactivity — the first request can take a couple of seconds.
