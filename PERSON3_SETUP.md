# DentalPay Person 3 — Scheduling & Reminders

This package adds Person 3's work to the existing BiteWell repository without merging the separate Person 1 branch.

## Included features

- Appointment creation, editing, cancellation and calendar view
- Doctor time-overlap conflict detection
- Tenant-scoped appointment and reminder queries
- Patient Details "Next Visit" card
- Upcoming-visit reminder generation
- Payment-due and overdue reminder adapter for Person 2's `installments` collection
- SMS and WhatsApp channels
- Atomic send protection and reminder de-duplication
- Safe mock sending during development
- Optional Twilio REST integration
- `ActivityLog` writes using snake_case actions
- Live Upcoming Visits and Recent Activity dashboard sections
- Scheduling/reminder report section with CSV export
- Automated backend tests and a Postman collection

## Important branch rule

Do not build this work on `feature/atiqa-patients-clinical`. The team has not selected the final Person 1 implementation.

Person 3 must start from the latest `main`:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub
git status
git switch main
git pull --ff-only origin main
git switch -c feature/atiqa-scheduling-reminders
git branch --show-current
```

The last command must print:

```text
feature/atiqa-scheduling-reminders
```

If the branch already exists, use:

```powershell
git switch feature/atiqa-scheduling-reminders
```

## Copy the overlay into the repository

1. Download `DentalPay-Person3-Overlay.zip`.
2. Extract it into Downloads.
3. Confirm the extracted folder contains `backend`, `frontend`, `postman`, and this setup file.
4. Run this in PowerShell:

```powershell
$overlay = "C:\Users\atiqa\Downloads\DentalPay-Person3-Overlay"
$repo = "C:\Users\atiqa\projects\BiteWell-GitHub"

Get-ChildItem -LiteralPath $overlay -Recurse -File -Force | ForEach-Object {
    $relativePath = $_.FullName.Substring($overlay.Length).TrimStart('\')
    $destination = Join-Path $repo $relativePath
    New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    Write-Host "Copied: $relativePath" -ForegroundColor Green
}
```

5. Return to the repository:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub
git status --short
```

Do not continue if the current branch is `main`.

## Configure the backend

Create `.env` only if it does not already exist:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub\backend

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

notepad .env
```

For normal local development, use:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/dentalpay
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
REMINDER_SEND_MODE=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
```

Keep `REMINDER_SEND_MODE=mock` until the team intentionally configures Twilio. Never commit `.env`.

Install and test:

```powershell
npm ci
npm run check
npm test
```

Expected automated result:

```text
tests 6
pass 6
fail 0
```

## Configure the frontend

Open a second PowerShell terminal:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub\frontend

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

npm ci
npm run lint
npm run build
```

Lint must finish with no warnings or errors. The build must say `built`.

## Start the application

Backend terminal:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub\backend
npm run dev
```

Expected:

```text
Successfully connected to MongoDB.
Server is running on port 5000
```

Frontend terminal:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub\frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## Manual UI test order

### 1. Create or confirm a patient

Appointments require a patient from the same clinic. Open Patients and make sure at least one patient exists with a phone number such as:

```text
+923001234567
```

The `+92` country code is required only for real Twilio sending. Mock mode works without sending externally.

### 2. Book an appointment

1. Open **Appointments** from the sidebar.
2. Click **Book Appointment**.
3. Select a patient.
4. Keep the default development Doctor ID.
5. Select a future start and end time.
6. Click **Book Appointment**.
7. Confirm it appears in the calendar and Month agenda.

### 3. Verify conflict detection

1. Book another appointment.
2. Use the same Doctor ID.
3. Choose a time overlapping the first appointment.
4. The API must reject it with:

```text
This doctor already has an appointment during the selected time.
```

Appointments that touch but do not overlap are allowed. For example, 9:00–9:30 and 9:30–10:00 are allowed.

### 4. Verify Next Visit

1. Open Patients.
2. Open the patient used for the appointment.
3. The Patient Details page must show the soonest future active appointment in **Next Visit**.

### 5. Generate reminders

1. Open **Reminders**.
2. Click **Sync SMS** or **Sync WhatsApp**.
3. Upcoming visits in the next seven days produce reminders.
4. Press the same sync button again.
5. The same source/channel reminder must not be duplicated.

Payment reminders read Person 2's eventual MongoDB `installments` collection without declaring a competing schema. Until that collection contains compatible records, the payment sync count correctly remains zero.

Expected installment fields:

```text
clinicId, patientId, amount, dueDate, status
```

Supported payment statuses:

```text
pending, overdue
```

### 6. Verify sending protection

1. Keep `REMINDER_SEND_MODE=mock`.
2. Click **Send now** on a pending reminder.
3. It changes to `sent`.
4. A sent reminder cannot be sent again.
5. The action appears in Recent Activity.

### 7. Verify Dashboard and Reports

1. Dashboard Upcoming Visits must show real appointments scheduled today.
2. Dashboard Recent Activity must show appointment/reminder actions.
3. Open Reports.
4. Select a scheduling date range.
5. Refresh the report.
6. Export the Scheduling CSV.

## Postman testing

1. Open Postman.
2. Click **Import**.
3. Select:

```text
postman\DentalPay-Person3.postman_collection.json
```

4. Start the backend.
5. Run requests from `01` through `13` in order.

Important expected tests:

- Request 03 creates an appointment.
- Request 04 returns `409` for a doctor conflict.
- Request 06 returns the patient's next visit.
- Request 09 sends once in mock mode.
- Request 10 returns `409` for a duplicate send.

## Real Twilio integration

Only configure this after the team provides approved Twilio credentials.

```env
REMINDER_SEND_MODE=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_WHATSAPP_NUMBER=+1...
```

For WhatsApp, the backend automatically adds the `whatsapp:` prefix. Do not place credentials in frontend files, screenshots, Postman, commits, or group chats.

## Safe Git review and commit

Return to the repository root:

```powershell
cd C:\Users\atiqa\projects\BiteWell-GitHub
git branch --show-current
git status --short
git diff --check
git diff --stat
```

The branch must be:

```text
feature/atiqa-scheduling-reminders
```

The following must not appear:

```text
.env
node_modules
dist
uploads
```

Stage only Person 3 files:

```powershell
$person3Files = @(
    "PERSON3_SETUP.md",
    "backend\.env.example",
    "backend\.gitignore",
    "backend\app.js",
    "backend\index.js",
    "backend\package.json",
    "backend\controllers\Appointment.controller.js",
    "backend\controllers\Reminder.controller.js",
    "backend\controllers\Scheduling.controller.js",
    "backend\models\ActivityLog.model.js",
    "backend\models\Appointment.model.js",
    "backend\models\Reminder.model.js",
    "backend\routes\Appointment.routes.js",
    "backend\routes\Reminder.routes.js",
    "backend\routes\Scheduling.routes.js",
    "backend\services\activity.service.js",
    "backend\services\reminder.service.js",
    "backend\services\twilio.service.js",
    "backend\test\scheduling.test.js",
    "backend\utils\scheduling.js",
    "backend\utils\scopedQuery.js",
    "frontend\.env.example",
    "frontend\.gitignore",
    "frontend\src\App.jsx",
    "frontend\src\index.css",
    "frontend\src\components\Appointments.jsx",
    "frontend\src\components\Dashboard.jsx",
    "frontend\src\components\NextVisitCard.jsx",
    "frontend\src\components\PatientList.jsx",
    "frontend\src\components\PatientProfile.jsx",
    "frontend\src\components\Reminders.jsx",
    "frontend\src\components\Reports.jsx",
    "frontend\src\components\SchedulingReportSection.jsx",
    "frontend\src\components\TreatmentCatalog.jsx",
    "frontend\src\lib\api.js",
    "frontend\src\lib\date.js",
    "postman\DentalPay-Person3.postman_collection.json"
)

git add -- $person3Files
git status --short
git diff --cached --check
git diff --cached --stat
```

Staged files begin with `A` or `M`. There should be no `??`.

Commit:

```powershell
git commit -m "feat: add scheduling and reminder module"
```

Update against the latest team code:

```powershell
git fetch origin
git rebase origin/main
```

If a conflict occurs, stop. Do not blindly choose Current or Incoming. Shared files requiring team review include:

- `backend/app.js`
- `backend/index.js`
- `backend/utils/scopedQuery.js`
- `frontend/src/App.jsx`
- `frontend/src/components/Dashboard.jsx`
- `frontend/src/components/PatientProfile.jsx`
- `frontend/src/components/Reports.jsx`
- `frontend/src/index.css`

After a clean rebase, rerun all backend and frontend checks. Then push:

```powershell
git push -u origin feature/atiqa-scheduling-reminders
```

Create a new PR:

- Base: `main`
- Compare: `feature/atiqa-scheduling-reminders`
- Title: `Add Scheduling & Reminders module`

Do not add these commits to the Person 1 PR.
