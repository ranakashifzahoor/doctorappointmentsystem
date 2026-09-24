# Prescrip — Doctor Appointment Booking System (MERN)

A production-style MERN application with three roles — **Patient**, **Doctor**, **Admin** — built with
React + Vite, Express and MongoDB. Patients browse doctors, pick a real time slot, book, pay online
(Card / **Easypaisa** / **JazzCash**), rate the doctor, reschedule or cancel; doctors can self-register
and manage their appointments and profile; admins verify doctors and manage appointments, reviews and
messages.

> Stack: React 18 + Vite + Tailwind CSS + React Router + Axios + React Toastify · Node + Express + Mongoose + JWT + bcryptjs + Multer (+ Cloudinary) · MongoDB · prices in **Rs. (PKR)**

---

## 0. Location

This project lives at **`D:\doctor`**.

```
D:\doctor\backend     # API        (port 4000)
D:\doctor\frontend    # Patient    (port 5173)
D:\doctor\admin       # Admin+Doc  (port 5174)
D:\doctor\portal      # unified login page, served at /portal
```

---

## 1. Ports & URLs

| Service | URL |
|---|---|
| Unified portal (all three logins in one page) | http://localhost:4000/portal |
| Patient website | http://localhost:5173 |
| Admin + Doctor panel | http://localhost:5174 |
| Doctor sign-up | http://localhost:5174/doctor/signup |
| API | http://localhost:4000 |

The portal signs you in through the API and hands the JWT to the target app (`?token=...`), so one
page covers patient, doctor and admin entry.

**Doctor self-sign-up:** from the doctor login screen choose *“Sign up as doctor”* to create your own
doctor account with a photo and profile. New doctors start **unverified** — they can log in and complete
their profile, but they stay out of the public list and cannot receive bookings until an admin approves
them (Admin → Doctor List → **Verify**). Once verified they are published and bookable; **Revoke** hides
them again.

---

## 2. Project structure

```
D:\doctor\
├── backend/                    # Express REST API
│   ├── config/                 # mongodb.js, cloudinary.js
│   ├── controllers/            # user, doctor, admin, contact
│   ├── middleware/             # authUser, authDoctor, authAdmin, multer, errorMiddleware
│   ├── models/                 # user, doctor, appointment, review, contact
│   ├── routes/                 # user, doctor, admin, contact
│   ├── services/               # paymentService (card/easypaisa/jazzcash), cloudinaryService, emailService
│   ├── tests/                  # smoke.js (end-to-end API test)
│   ├── uploads/                # local image storage + seeded doctor photos
│   ├── utils/                  # generateToken, slotUtils, upload, seed
│   ├── .env / .env.example
│   └── server.js
│
├── frontend/                   # Patient website (5173)
│   ├── src/{components,context,pages,services,utils}
│   └── public/favicon.svg
│
├── admin/                      # Admin + Doctor panel (5174)
│   ├── src/{components,context,pages,services,utils}
│   └── public/favicon.svg
│
└── portal/                     # Unified login launcher (served at /portal)
    └── index.html
```

---

## 3. Installation

```bash
cd D:\doctor\backend  && npm install
cd D:\doctor\frontend && npm install
cd D:\doctor\admin    && npm install
```

Env files: each app ships a working `.env` for local development; `.env.example` documents every
variable.

---

## 4. Environment variables

**backend/.env**

| Variable | Purpose |
|---|---|
| `PORT`, `BACKEND_URL` | API port (4000) and its public URL |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/prescrip` |
| `JWT_SECRET` | JWT signing secret — change it |
| `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_SECRET_KEY` | Image uploads. Optional → falls back to `backend/uploads` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin login (env-based, not a DB collection) |
| `PAYMENT_DEMO` | `true` simulates **all** payment methods locally (no keys); `false` requires real keys |
| `PAYMENT_CURRENCY` | `PKR` |
| `PAYMENT_KEY_ID` / `PAYMENT_KEY_SECRET` | Razorpay (card/wallet) |
| `EASYPAISA_STORE_ID` / `EASYPAISA_HASH_KEY` / `EASYPAISA_ENDPOINT` | Easypaisa |
| `JAZZCASH_MERCHANT_ID` / `JAZZCASH_PASSWORD` / `JAZZCASH_INTEGRITY_SALT` / `JAZZCASH_ENDPOINT` | JazzCash |

**frontend/.env** → `VITE_BACKEND_URL`, `VITE_PAYMENT_KEY_ID` (public key id only)
**admin/.env** → `VITE_BACKEND_URL`

---

## 5. Database setup

```bash
cd D:\doctor\backend
npm run seed        # creates 6 doctors (with photos) + patient + sample reviews
npm run db:reset    # drops demo collections first, then seeds (clean slate)
```

Collections: `users`, `doctors`, `appointments`, `reviews`, `contacts`.

---

## 6. Running

```bash
cd D:\doctor\backend  && npm run dev     # API        :4000
cd D:\doctor\frontend && npm run dev     # Patient    :5173
cd D:\doctor\admin    && npm run dev     # Admin+Doc  :5174
```

Then open http://localhost:4000/portal for the unified login page.

---

## 7. Test accounts

| Role | URL | Email | Password |
|---|---|---|---|
| Admin | http://localhost:5174/admin/login | `admin@prescrip.com` | value of `ADMIN_PASSWORD` in `backend/.env` |
| Doctor | http://localhost:5174/doctor/login | `emily.carter@prescrip.com` | `doctor1234` |
| Patient | http://localhost:5173/login | `patient@example.com` | `patient1234` |

All six seeded doctors use `doctor1234`: `rajesh.kumar@`, `ayesha.khan@`, `michael.lee@`,
`sofia.martinez@`, `daniel.osei@prescrip.com`. You can also create a new doctor from
http://localhost:5174/doctor/signup.

---

## 8. Payment methods

| Method | Provider | Notes |
|---|---|---|
| Card / Wallet | Razorpay | `PAYMENT_KEY_ID` + `PAYMENT_KEY_SECRET` (server-side only) |
| Easypaisa | Easypaisa hosted checkout | `EASYPAISA_STORE_ID` + `EASYPAISA_HASH_KEY`; SHA-256 request hash built server-side |
| JazzCash | JazzCash MWALLET/Payment API | `JAZZCASH_MERCHANT_ID` + `JAZZCASH_PASSWORD` + `JAZZCASH_INTEGRITY_SALT`; HMAC-SHA256 secure hash built server-side |

Flow: patient books → chooses a method → server creates the order/payload → gateway → server verifies
(HMAC / hash) → appointment marked **paid**. An appointment is never marked paid without verification.

`PAYMENT_DEMO=true` (default) simulates every method without keys so the full flow is testable offline;
the UI labels it as demo mode. Set `PAYMENT_DEMO=false` and add real keys for live gateways.

### Other external services

- **Cloudinary** (optional): without it images are stored in `backend/uploads` and served at `/uploads/...`.
- **E-mail/SMS**: stubbed in `backend/services/emailService.js` (add SMTP/Twilio credentials there).

---

## 9. API reference

Base `http://localhost:4000`; responses are `{ success, message, data? }`; protected routes take
`Authorization: Bearer <jwt>`.

### Patient
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/user/register` · `/login` · `/logout` | – / user | Account |
| GET | `/api/user/profile` | user | Profile |
| POST | `/api/user/update-profile` | user | Update profile + photo (multipart) |
| GET | `/api/user/appointments` | user | My appointments (includes `reviewed` flag) |
| POST | `/api/user/book-appointment` | user | Book (`doctorId`, `slotDate`, `slotTime`) |
| POST | `/api/user/reschedule-appointment` | user | Move to another free slot |
| POST | `/api/user/cancel-appointment` | user | Cancel (frees the slot) |
| POST | `/api/user/review` | user | Rate a **completed** appointment (1–5 + comment) |
| GET | `/api/user/payment-methods` | – | Available methods + required env vars |
| POST | `/api/user/payment` | user | Create order (`appointmentId`, `method`) |
| POST | `/api/user/verify-payment` | user | Verify and mark paid |

### Doctor
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctor/list?speciality=&search=` | – | Verified doctors incl. `rating`/`reviewCount` |
| GET | `/api/doctor/:id` | – | Doctor details (+ rating) |
| GET | `/api/doctor/:id/reviews` | – | Reviews + average |
| POST | `/api/doctor/register` | – | Doctor self sign-up (multipart photo); starts unverified |
| POST | `/api/doctor/login` | – | Doctor login |
| GET/POST | `/api/doctor/profile` · `/update-profile` | doctor | Profile (photo, fee, about, address…) |
| POST | `/api/doctor/change-availability` | doctor | Toggle availability |
| GET | `/api/doctor/appointments` | doctor | My appointments |
| POST | `/api/doctor/complete-appointment` · `/cancel-appointment` | doctor | Update status |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/login` | – | Admin login |
| GET | `/api/admin/dashboard` | admin | Doctors, patients, appointments, reviews, unread messages, pending doctors + latest |
| GET | `/api/admin/doctors` | admin | All doctors (no passwords, includes `verified`) |
| POST | `/api/admin/add-doctor` · `/update-doctor` · `/remove-doctor` | admin | Manage doctors (multipart image) |
| POST | `/api/admin/verify-doctor` | admin | Approve / revoke a self-registered doctor |
| POST | `/api/admin/change-availability` | admin | Toggle doctor availability |
| GET | `/api/admin/appointments` · POST `/cancel-appointment` | admin | Appointments |
| GET | `/api/admin/reviews` | admin | All reviews |
| GET | `/api/admin/messages` · POST `/message-read` · `/message-delete` | admin | Contact messages |
| POST | `/api/contact` | – | Website contact form |
| GET | `/api/health` | – | Health + payment/cloudinary status |

---

## 10. Business rules enforced

1. No booking of unavailable/booked slots; duplicate doctor/date/time rejected.
2. Only authenticated patients book; patients cancel/reschedule only their own.
3. Doctors manage only their own appointments.
4. Completed appointments can't be cancelled/rescheduled; cancelled ones can't be paid or reviewed.
5. Cancelling or rescheduling releases the old slot back to availability.
6. Reviews only from the owning patient, only after completion, once per appointment.
7. Unverified (self-registered) doctors are hidden from the public list and cannot be booked.
8. Payment marked paid **only** after server-side verification.
9. Passwords bcrypt-hashed and never returned by any endpoint.

---

## 11. Testing

```bash
cd D:\doctor\backend && npm run smoke     # 51 end-to-end checks
```

Covers auth, doctor listing/photos/ratings, booking, double-booking, all three payment methods,
reschedule (incl. slot release + collision), cancellation, review flow, contact messages, doctor flows,
admin add/edit/remove/list, **doctor self-signup + admin verification**, and authorization guards.

Slot system: 10:00–20:30 in 30-minute steps (`backend/utils/slotUtils.js`, mirrored in
`frontend/src/utils/slots.js`).

---

## 12. Notes / limitations

- E-mail/SMS notifications are stubbed.
- Easypaisa/JazzCash live mode requires merchant credentials (§8); demo mode works without them.
- Admin credentials are environment-based (as in the reference project).
- Seed portraits in `backend/uploads/` are AI-generated demo assets — replace with real photos before production.

---

## 14. Update — admin panel removed (2026-09-24)

The project now ships **two** apps: the **patient website** (:5173) and the **doctor panel** (:5174).

- The unified portal at `/portal` has two cards — Patient and Doctor.
- Doctor self-registration is now **immediately active**: a new doctor is created verified and
  available, so they appear in the public list and can take bookings right away (no approval step).
- The admin-only screens (dashboard, appointments, add/edit doctor, messages, reviews) were removed
  from the UI. The corresponding API routes still exist server-side and are unused by the UI; a
  doctor can be suspended via `POST /api/admin/verify-doctor` if you ever need it.
- Sections 1, 7 and 9 above describe the earlier three-app layout — everything else (install, env,
  payments, business rules, testing) is unchanged.
