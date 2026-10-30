# Save80 Stove Tracker

A Netlify frontend backed by Firebase Authentication and Cloud Firestore Standard edition. The retired Flask/Dash/MySQL/Redis app is preserved under `legacy/` for reference only. Netlify publishes **only `dist/`**.

## Features

- Email/password accounts, verification email with persistent delivery feedback and a resend cooldown, password reset and explicit session/remember-me choice.
- Administrator-approved team access: viewer, editor and administrator.
- Individual Save80 stove registration, optional phone, string Product IDs, recipient households and validated coordinates. Date values are blank in Records and its CSV export; the actual registration date and server timestamp remain in Firestore.
- Full-height Google satellite/street map, text/state filters, sorting, stable record selection, paginated Records and CSV export with formula injection protection.
- 250-record database pages, 25-row table pages and explicit load-more. Search, totals, map and export cover the loaded records; load older records to include them.
- Optional authenticated, rate-limited Netlify geocoding function; manual coordinates work without Google API billing.
- Append-only records: correction/deletion requires an administrator using trusted backend tools. The original app also did not offer record editing.

- Responsive sidebar drawer on phones, collapsible desktop navigation, mobile record cards, and persistent light/dark mode. Partner logos are at the bottom of the expanded sidebar and hidden when collapsed.

## Local development

Use Node.js 22 LTS (22.12+) and npm. Run `npm ci`, copy `.env.example` to `.env`, fill in your Firebase web config, and run `npm run dev`.

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID` are public web configuration. `VITE_GOOGLE_MAPS_API_KEY` is the separate browser map key; restrict it to the site hostname and Maps JavaScript API. The map defaults to satellite imagery with a street-layer switch. Never put a service-account private key, database password or Google server key in a `VITE_` variable. No Admin SDK credentials are needed by the deployed website.

## Firebase setup

1. Create a Firebase project and a **Standard edition `(default)` Firestore database** in the selected permanent region. Do not enable public/test-mode access.
2. Register a Firebase Web app and obtain its SDK configuration.
3. Enable Email/Password authentication. Set the password policy to at least 8 characters. Leave email enumeration protection enabled.
4. Add the Netlify hostname to Authentication > Settings > Authorized domains. Add localhost only if local development is needed.
5. Deploy rules and indexes using `npx -y firebase-tools@latest deploy --only firestore --project PROJECT_ID`. Rules must be deployed before real records are stored.
6. Create your first account on the website and verify your email. In the Firestore console create `members/FIREBASE_AUTH_UID` containing exactly `{ "role": "admin" }`. This privileged bootstrap happens only in the trusted console, never via self-registration.
7. Use Team access in the website to grant other verified accounts `viewer`, `editor` or `admin` access. Administrators can update other members' roles. Revocation is available by deleting the relevant `members/UID` document in the trusted Firebase console.

Accounts are now identified by email. Existing MySQL usernames/passwords are not automatically imported; users should create and verify Firebase accounts. User profile details remain in Firebase Authentication rather than a shared users collection. Membership documents contain only a role. Project/client details are shared only with explicitly approved workspace members.

## Netlify deployment

- Import this repository and select the migration branch (or main after merge).
- Build command: `npm run build`; publish directory: `dist`; Functions directory: `netlify/functions`; Node: 22.
- Set the four `VITE_FIREBASE_*` variables above for builds **and Functions**, and `VITE_GOOGLE_MAPS_API_KEY` for builds. Build fails if any public configuration is absent.
- Set `GOOGLE_GEOCODING_API_KEY` for Functions, enable the Google Geocoding API, restrict this separate server key to that API and configure quotas. A website/referrer-restricted browser key cannot be used for server-side geocoding. The key is never sent to the browser. Without this key, Find coordinates reports its unavailability and users enter coordinates manually.
- Deploy, then verify sign-in, access checks, registration, map selection and CSV export on the live hostname. Netlify deploy previews use the same backend if given production configuration; use a separate Firebase project for isolated testing.

`netlify.toml` defines SPA routing, API routing and security headers. The map uses Google Maps JavaScript API with its required attribution. Enable the API in the Google Cloud project associated with the website-restricted browser key. Satellite is the default view. Google venue/transit labels and icons are hidden on both layers; the map markers represent registered stoves. Map script, tile, font, worker and connection domains are allowed explicitly in the CSP; inline script execution remains blocked. Records are rendered as text; map popups do not interpret database values as HTML.

## Existing record migration

Export `zamfara_customers` from MySQL as a JSON array, preserving `id`, `name`, `address`, `phone`, `nin`, `asset_count`, `latitude`, `longitude`, `state`, `date`. Keep exports outside the repository and outside `public/`. Null or absent phone becomes blank. Rows missing required fields or coordinates must be corrected before import. Product IDs map from `nin`; leading zeros lost in the original numeric database cannot be reconstructed automatically.

Validate without connecting to Firebase:

```sh
npm run import:records -- /absolute/private/records.json --project=YOUR_PROJECT_ID
```

After a backup and dry-run review, use an authorised Application Default Credential (`GOOGLE_APPLICATION_CREDENTIALS` pointing outside this repository) and add `--commit`. The importer requires one stove per row, rejects duplicate Product IDs and grouped counts, and creates the same deterministic `stove-SHA256` documents as the app. It skips identical prior imports and refuses to overwrite conflicting records. Each successful row is durable; rerun after fixing a failure. It never logs private field values. Admin SDK access bypasses Firestore rules; use only trusted exports and an explicitly selected target project.

Do not retire the Heroku service or original database until the imported counts and fields have been reconciled. This code change alone does not transfer records or rotate credentials exposed in Git history.

## Validation

- `npm test` — validation, migration mapping, record identity, CSV safety and geocoding authorization.
- `npm run test:rules` — Firestore emulator authorization/schema tests; requires Java 21+.
- `npm run build:check` — source build without deployment configuration.
- `npm run build` — deployable build requiring Firebase configuration.
- `npm audit --audit-level=moderate` — dependency audit. Patched transitive dependencies are pinned through overrides because upstream packages retain vulnerable ranges.

See `REVIEW.md` for original-code findings and remaining operational requirements.

## Save80 programme update

The user-facing app is generalised for the TBCN–atmosfair Save80 collaboration across states/regions. The Product ID printed on each stove is the unique identifier; every new registration represents one stove and links it to a recipient and delivery location. The prior `project` and `assetCount` storage fields are retained for compatibility (`project` stores the Product ID, `assetCount` is 1 for new records). New record IDs are `stove-` plus the SHA-256 digest of the exact, trimmed Product ID. Firestore validates that relationship and disallows overwriting a registered ID. Leading zeroes and punctuation are preserved; IDs remain case-sensitive as printed.

The Save80 programme page uses product background and a credited stove photograph from Oliver Adria's September 2014 bigEE/Wuppertal technology guide supplied by the user. Product background is not a measured programme result. Dashboard counts do not imply certified carbon credits or quantified emission savings. Partner logos reuse the established project assets.

Existing data migration is deferred at the user's request. No original database records have been changed or imported. Historical resource IDs and repository names may retain Zamfara internally; they do not restrict programme locations.

Partner logos are displayed at the bottom of the expanded authenticated navigation and on public programme pages. They are hidden when the sidebar is collapsed.

## Rollback before the 30 October client redesign

The previous production version is preserved at commit `f371ba1daddd3213b224782d6e62c346c60a2552` on branch `backup/save80-before-client-redesign-2026-10-30`. The retained Netlify production deploy is `6ae1065ee362a505a765ae73`. Publish that retained deployment in Netlify to restore the earlier UI, or deploy the backup branch. Keep an eye on auto-publishing so a later push does not replace a deliberate rollback. No database migration or rules change is part of this redesign.
