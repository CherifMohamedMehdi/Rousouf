# Roufouf — Admin Guide

> Plain-language manual for editors and moderators working in the Directus
> admin panel. No coding required. If you want to know *how* Directus works
> underneath, see `SCHEMA.md`.

This guide walks through the everyday tasks you'll perform from the Directus
admin panel at `https://cms.roufouf.tn/admin`.

---

## 1. Who does what

| Role | Can do |
| ---- | ------ |
| **Viewer** (public API) | Read published content only. This is what the website uses. |
| **Editor** | Create/edit documents, organizations, partners, team members; triage suggestions and submissions. |
| **Moderator** | Everything an Editor can, plus review/approve suggestions and submissions, and flag organizations as verified. |
| **Admin** | Full access: manage users, roles, flows, taxonomies, donation tiers, and site-wide pages. |

To give someone an account, go to **User Directory → Create User**, set their
role, and send them the invite email.

---

## 2. Adding a new document (the common case)

1. Sidebar → **Content → Documents → Create Item**.
2. Fill in at minimum:
   - **Title** (required).
   - **Organization** (required — pick from the list; if missing, create it first; see §6).
   - **Type** (policy brief, report, study, …).
   - **Themes** (you can tick multiple).
   - **Language** and, if the document covers a region, **Governorate**.
   - **Date published** (month/year is fine).
   - **Abstract** — short summary shown on cards and detail pages.
   - **Abstract translations** — optional: fill `ar`, `fr`, `en` in the JSON block
     for a localized abstract shown to each audience.
3. Attach the PDF(s):
   - For a single-file report, upload to **PDF file**.
   - For multi-file reports (annexes, appendices), leave the main field empty
     and use the **document_files** junction: *Add item → upload → set role
     (main, annex, translation) + label*.
4. Leave **status = draft** while you're still checking. When done, change
   **status → published**.
5. Click **Save**.

> **Duplicate detection.** When a user submits a PDF through the website we
> compute a SHA-256 hash and a content fingerprint and store them on the
> document. If you paste a duplicate PDF you'll see a warning on the submission
> review screen. You can still publish if it's genuinely a new edition —
> just fill the **Supersedes** field so visitors see the version history.

---

## 3. Reviewing user suggestions (edit requests)

Visitors can click the little pencil icon next to any metadata field on a
document or organization page to suggest a correction. These land in the
**Suggestions** collection.

1. Sidebar → **Content → Suggestions**.
2. Use the saved filter **"Pending"** (status = pending) to see the inbox.
3. Open one. You'll see:
   - **Target type** (`document` or `organization`) and **Target ID**.
   - **Field name** (e.g. `title`, `date_published`, `themes`).
   - **Current value** vs **Suggested value**.
   - An optional **Message** from the user.
4. If the suggestion is right:
   - Click the linked target to open it in a new tab.
   - Apply the change there and **Save**.
   - Return to the suggestion, change **status → applied**, add an internal note.
5. If it's wrong or spam, set **status → rejected** and save.
6. Suggestions are never shown to the public — visitors only see the merged
   result after an editor applies it.

> **Tip.** If you're comfortable, the Directus Flow "Apply accepted
> suggestion" can do the update and status change in one click.

---

## 4. Reviewing user submissions (new documents)

Visitors submit new PDFs through the website's **Submit** page. They come in
as **Submissions** (not yet Documents).

1. Sidebar → **Content → Submissions → status = pending**.
2. Open the submission. You'll see:
   - The proposed metadata pre-filled by the user.
   - A duplicate flag if our hash/fingerprint matches an existing document.
   - The uploaded PDF(s).
3. Decide:
   - **If it's legitimate and new:**
     1. Click **Promote to document** (custom button in the item view) — this
        copies the metadata and files to a new item in **Documents** and
        links it back to the submission.
     2. Open the new document, double-check taxonomy fields and **status →
        published**.
     3. Return to the submission and set **status → promoted**.
   - **If it's a duplicate of an existing document:**
     1. Set **status → rejected** with note "duplicate of #{existing id}".
   - **If it's spam, out-of-scope, or low-quality:** set **status → rejected**
     and add a short internal note. No response is sent to the submitter.

> The submission collection is public-writable, so rate limiting and honeypot
> checks happen at the API layer before a submission is ever created.

---

## 5. Managing partners (homepage strip)

1. Sidebar → **Content → Partners** — you'll see a card grid of current
   partners, each with a logo preview and an **is_active** toggle.
2. To **add a partner**: **Create Item**.
   - **Name**, **Website**, **Logo** (upload; SVG preferred).
   - **Tier** — `funder`, `institutional`, `media`, or `community`.
   - **Sort order** — smaller numbers appear first within a tier.
   - **is_active** → on to show on the homepage.
3. To **reorder**: drag the sort-order field, or change the number inline in
   the card grid view.
4. To **temporarily hide** a partner, toggle **is_active → off** (keeps the
   record and logo so you can bring it back later).

---

## 6. Verifying an organization

"Verified" means *we* (the Roufouf team) have confirmed this organization
exists, is legitimate, and the documents listed under it really are theirs.
A small blue check appears next to the name on the public site.

1. Sidebar → **Content → Organizations → select the org**.
2. Toggle **is_verified → on**.
3. Fill **verified_at** (today's date) and **verified_by** (your user).
4. **Save**. Public pages update within a minute (ISR revalidation).

To unverify, flip the toggle back off and clear the date fields.

> **Bulk action.** Select multiple orgs in the list view → ⋯ → **Verify
> organizations** to toggle several at once.

---

## 7. Editing the homepage copy, about page, and donation page

These live in the **Pages** singleton (Sidebar → **Content → Pages**). There
is exactly one record; there's no Create button.

Fields you can safely edit from here:
- **Hero heading / sub-heading** (per locale).
- **About text** (rich text per locale).
- **Mission statement** (per locale).
- **Impact callouts** (array of `{ amount, currency, description }`) — shown
  on the donation page.
- **Transparency note** (per locale).
- **Contact email**, **Social URLs** (Twitter, LinkedIn, Facebook, YouTube).

Save to apply. The public site auto-revalidates after a few minutes.

### Team

**Content → Team Members → Create Item** for each person.
Fill `name`, `role` (localized), `bio` (localized), optional `photo`, optional
`linkedin_url`, and `sort_order`. Only records with **is_active = true** show
up on the About page.

---

## 8. Donation tiers and leads

### Tiers (what users see as preset amounts)

1. Sidebar → **Content → Donation Tiers**.
2. Each tier has: **amount**, **currency** (TND / EUR / USD), **label** (per
   locale), optional **description**, **sort_order**, and **is_active**.
3. Deactivate (is_active = false) tiers instead of deleting them, so we keep
   history.

### Leads (captured when payments are off)

Until the real payment integration is live, donation attempts land in the
**Donation Leads** collection with the visitor's chosen amount, currency,
frequency, and — only if they opted in — name and contact info. Use this
list to follow up manually via email/bank transfer.

Once a lead pays, mark **status → converted** and (optionally) add a matching
entry in **Donations** with their payment reference.

### Donors wall on the homepage

Only donations with **display_on_homepage = true** and **is_anonymous =
false** appear on the wall. The component picks a random sample server-side
so the list refreshes on each visit.

---

## 9. Contact messages

Visitors use the About page form. Messages land in **Contact Messages** with
name, email, subject, message, and creation date. Use the saved filter
**"Unanswered"** (is_answered = false) to work through the queue. Mark
**is_answered → true** after replying out-of-band.

---

## 10. Taxonomies (themes, types, governorates, languages)

Adding a new taxonomy term is the same everywhere:
1. Open the collection (e.g. **Themes**).
2. **Create Item** → fill `slug` (lowercase, no spaces, ASCII), `name_ar`,
   `name_fr`, `name_en`, optional `description`, optional `sort_order`.
3. Set **is_active = true**.
4. Save. The new term appears in the FilterSidebar on the public site and in
   the Documents create form immediately.

To rename a term, change the `name_*` fields — the slug should stay the same
to keep shareable URLs working.

---

## 11. Quick troubleshooting

| Symptom | What to check |
| ------- | ------------- |
| New document doesn't show on the site | Status must be `published`, not `draft` or `pending`. |
| Edit doesn't show immediately | Public pages revalidate every few minutes; force-reload or wait. |
| Partner logo looks blurry | Upload a transparent SVG when possible; otherwise PNG at 2x size. |
| Duplicate warning on a legit new edition | Fill **Supersedes** on the new document pointing to the older one, then publish. |
| Suggestion inbox growing | Use the saved filters: Pending / Spam / Applied. Reject obvious spam first. |
| Homepage still shows an old partner | Toggle **is_active → off** and save; clear the Next.js cache if urgent. |

---

## 12. Who to ask

- **Content questions** (is this a report or a policy brief?): project lead.
- **Technical questions** (save button greyed out, weird error): send a
  screenshot to the dev channel.
- **Account / permissions**: admin on duty.

Keep this file bookmarked. It's updated whenever workflows change.
