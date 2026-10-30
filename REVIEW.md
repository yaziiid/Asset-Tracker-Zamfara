# Review and migration notes

## Original-code findings

1. **Critical: secrets in a public repository.** `cloud_db.ini` and `mailconfig.ini` contain database, Redis, SMTP, signing and API credentials. Removed from the migrated branch and ignored for future commits. Deletion does not revoke secrets or remove Git history. Rotate/restrict them at the providers and use newly issued values where needed.
2. **High: registration fails.** `legacy/dash_app/enrol.py` omits `form_phone`, but the enrollment callback requires a phone value and rejects empty input. Replaced with an optional, visible phone field and matching database validation.
3. **High: login redirects fail.** `legacy/main.py` nests `url_for()` and attempts to resolve `'/'` as an endpoint. It also redirects to unchecked `next` input. Replaced with Firebase Auth and app-controlled navigation.
4. **High: cross-session selection.** `legacy/dash_app/callbacks.py` saves `table_click` in a single global Redis key. One user can consume another user's selected record. Selection now stays in component state per browser session.
5. **High: wrong record after filter/sort.** Original table selection uses a visible row offset into the original dataframe. Current selection uses stable Firestore document IDs.
6. **High: numeric project assumptions.** Map search casts project/product IDs to integer and crashes on missing matches. New references remain strings; no-match searches display an empty state.
7. **Medium: fragile startup and stale records.** Database reads occur at Python module import; cache updates inconsistently set expiration. New app starts without backend record reads, handles database errors and supports bounded refresh/pagination.
8. **Medium: registration form clears even on failure.** Separate callback clears input on any submit click. New form clears only after a confirmed write.
9. **Medium: inconsistent column names.** Initial table labels use Project while refresh callback uses Product ID and returns a hidden phone column. New schema uses one consistent project field.
10. **Maintenance: old Python dependency pins and Heroku runtime.** Replaced the execution path with a locked Node/React build and Netlify configuration. Legacy dependencies are not installed or deployed.

## Access and data model

`members/UID`: one validated `role` field. Only a verified, bootstrapped administrator can grant/update another UID's role. Users cannot grant themselves access, change their own role or list memberships. Verified users may read their own membership status.

`records/ID`: name, address, optional phone, project reference, state, coordinates, integer asset count, ISO date string, server creation timestamp and creator UID. Verified approved viewers can read; editors/admins can create valid records. Client updates/deletes are denied. Administrators may use trusted tools for corrections and legacy import.

The shared project register is intentionally available to approved team members. It does not contain authentication passwords, tokens, private keys or user account profiles. Access approval should be limited to staff authorised to see project/client contact details.

## Security validation design

Emulator tests cover anonymous/unverified/unapproved access, the exact register query, viewer write denial, editor/admin create, spoofed author/timestamp, invalid coordinates/counts/types, extra fields, role escalation and record update/delete denial. Registration bounds all text lengths and numbers. CSV values are escaped and formula-prefixed text is neutralised. Popup content uses DOM text nodes.

## Remaining operational work

Actual Firebase provisioning, deployed rules, verified administrator bootstrap, Netlify environment configuration, live smoke tests and any old-data import must be confirmed separately. The original database data is not stored in this Git repository. Existing accounts are not automatically transferred. Rotate exposed credentials before reusing the old services or keys. A new restricted geocoding key is optional; manual coordinates need no Google API key.

## Verified implementation status (27 October 2026)

- New Firebase project: `zamfara-asset-tracker-2026`; Standard `(default)` Firestore database in `africa-south1`, free tier enabled.
- Firestore rules compiled and deployed; email/password Auth enabled.
- 11 application/API tests and 7 Firestore emulator tests passed.
- Real-config production build passed; dependency audit reported zero known vulnerabilities.
- Local emulator UI verified sign-in, project registration with an optional blank phone, persisted records and filtered table-to-map selection. Test fixtures were kept out of production.
- Default-deny attack review: public collection listing, unapproved/unverified access, arbitrary paths, orphan subcollections, spoofed creator/timestamp, invalid types/bounds, missing/extra fields, oversized strings, self-role escalation and client record updates/deletes were denied in emulator tests. No status transitions or replay-sensitive counters exist in this append-only model. Membership documents contain only a role; personal Auth profiles are not shared.

## Save80 generalisation (27 October 2026)

The app now represents the TBCN–atmosfair Save80 programme across states and regions. Zamfara government branding and the fixed state default were removed. The programme page and credited stove photograph draw from the supplied 2014 bigEE guide; no measured climate-impact totals are inferred from registration counts.

Each new record represents one physical stove. The exact printed Product ID is preserved as text in `project`, with `assetCount` fixed to 1. Record document IDs use a SHA-256 digest of that Product ID. Firestore validates the digest (normalising its hexadecimal representation to lowercase) and denies overwrites, arbitrary document IDs and concurrent duplicate registration. The deferred importer uses the same identity and refuses grouped counts or duplicate Product IDs for reconciliation before any import.

Validation: 12 application/API tests and 9 Firestore emulator tests pass, including simultaneous duplicate registration, role controls, schema bounds and immutable records. Local UI checks cover multi-state mapping and duplicate-ID feedback. Production build passes. No original MySQL records were accessed, changed or imported during this update. The first owner account is now verified and has been bootstrapped as administrator.


## Verification delivery and sidebar update

Firebase accepted a controlled verification resend and the owner confirmed email verification. The initial administrator membership was then created after checking the account was verified, enabled and no other administrator existed. Production stove records remain empty and no historical data was imported.

Signup email delivery results now live above the signup screen, preventing Auth navigation from hiding a send failure. Resend requests have a 60-second cooldown stored for the current browser session; Firebase throttling produces a longer five-minute retry delay and explains that backend limits can last longer. Failed requests are never labelled successful. Tests cover delayed failure after navigation, concurrent clicks, cooldown persistence after reload and backend throttling. The local Auth emulator UI confirmed successful resend feedback and a disabled timer after refresh.

Both partner logos now appear beneath Save80 branding in the authenticated navigation. Validation: 15 application/API/delivery tests pass and the production build passes; the 9 existing rules tests are unchanged.


## Client redesign — 30 October 2026

The overview is now Map: a full-height Google Maps satellite view with a street layer, location fitting, search and state filters. Records contains the summary metrics and a desktop table / mobile cards. The requested marketing headings are removed; the registration form has a concise title. Dates are blank in client-facing records and CSV, while the existing date and server timestamp remain stored and are used for record ordering.

The sidebar collapses on desktop and becomes a focus-trapped, dismissible drawer on phones. Partner logos replace the former programme slogan at the bottom of the expanded navigation and disappear when collapsed. Light/dark mode and desktop collapse preferences persist locally. Satellite imagery is not recoloured; the surrounding UI and street map adapt to theme.

A website-restricted public Maps key and a separate server Geocoding key are configured in Netlify. The server key is never included in Vite configuration or tracked source. Geocoding remains guarded by verified Firebase editor/admin authorization. The source and Netlify deployment of the previous version were recorded before edits; this release does not alter Firestore rules or stored records.

Google points-of-interest, transit labels and base-map icons are hidden in both light and dark styles, leaving only stove overlays as markers. The existing production record retains its original registration date and server timestamp after deployment.
