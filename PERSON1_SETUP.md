# DentalPay — Person 1 Setup and Testing

This project contains the Patients & Clinical module:

- Patient create, view, edit and delete
- Search, pagination and cleared/uncleared filters
- Tooth chart linked to clinic treatments
- Allergies and medical conditions
- Image/PDF attachments up to 5 MB
- Treatment catalog with soft deletion
- Dashboard patient counts and patient search
- Filtered patient CSV export
- Clinic-scoped queries

## 1. Install the prerequisites

Install:

- Node.js 20 or newer
- MongoDB Community Server, or create a MongoDB Atlas database
- Postman

Confirm Node and npm:

```powershell
node --version
npm --version
```

## 2. Configure and run the backend

Open PowerShell in the project folder:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

For local MongoDB, keep:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/dentalpay
CLIENT_ORIGIN=http://localhost:5173
AUTH_MODE=mock
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGODB_URI` with the Atlas connection string.
Never commit the `.env` file.

Install and verify:

```powershell
npm ci
npm run check
npm test
npm run dev
```

Expected final line:

```text
DentalPay API is running on http://localhost:5000
```

Test the health endpoint in a browser:

```text
http://localhost:5000/api/health
```

## 3. Configure and run the frontend

Open a second PowerShell window:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run lint
npm run dev
```

Open:

```text
http://localhost:5173
```

The local `VITE_API_URL` stays empty because Vite proxies API and attachment
requests to port 5000.

## 4. Test with Postman

1. In Postman, select **Import**.
2. Import `postman/DentalPay-Person1.postman_collection.json`.
3. Run requests in numerical order.
4. `01 - Create Treatment` stores `treatmentId` automatically.
5. `03 - Create Patient` stores `patientId` automatically.
6. For `09 - Upload Attachment`, select an image or PDF under 5 MB.
7. Run delete requests only when you intentionally want to remove test data.

The mock authentication defaults to this clinic:

```text
60c72b2f9b1d8b2bad000001
```

To verify multi-tenancy in Postman, add a different valid ObjectId in the
`x-clinic-id` request header. Records created under clinic A must not appear
when listing records under clinic B.

## 5. Exact feature-testing order

1. Create a treatment.
2. Create a patient.
3. Search the patient by name and phone.
4. Test All, Cleared and Uncleared filters.
5. Edit patient demographics.
6. Add and remove allergies and medical conditions.
7. Open the tooth chart, edit a tooth and save the complete chart.
8. Upload, open and delete an attachment.
9. Confirm dashboard counts change correctly.
10. Export All, Cleared and Uncleared patient CSV reports.
11. Create a patient with the same phone number in the same clinic; expect
    HTTP `409`.
12. Repeat the list request with another clinic ID; expect no leaked records.

## 6. Group integration contracts

### Group 1 authentication

`backend/middleware/auth.js` is intentionally mock-only for development.
Group 1's verified JWT middleware must populate:

```js
req.user = {
  clinicId,
  userId,
  role,
  isOwner
};
```

After JWT integration, remove `AUTH_MODE=mock`. Never enable mock mode in
production.

### Shared ActivityLog

Once Group 3 publishes the locked `ActivityLog` model/service, call it after
successful writes using these agreed action names:

```text
patient_created
patient_updated
patient_deleted
patient_tooth_chart_updated
patient_medical_info_updated
patient_attachment_added
patient_attachment_deleted
treatment_created
treatment_updated
treatment_deactivated
```

Do not create a second ActivityLog schema inside this module.

### Shared export utility

The current report page produces a correct CSV fallback. When Person 2
publishes the shared Excel/PDF/Print utility, pass the response from:

```text
GET /api/patients/export?status=all|cleared|uncleared&search=...
```

to that shared utility instead of duplicating export logic.

### Production attachments

Local uploads work for development and a persistent Node server. Before
serverless deployment, replace disk storage with the team-approved persistent
storage service, such as Cloudinary or S3. Keep the existing attachment API
contract so the frontend does not need to change.
