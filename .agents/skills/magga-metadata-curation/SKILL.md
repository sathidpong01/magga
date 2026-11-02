---
name: magga-metadata-curation
description: Research, curate, and link manga metadata, author profiles, and verified social channels using Magga MCP tools. Use when adding authors, social links, tags, or categories, creating or approving MCP metadata drafts, or resolving manga visibility issues in Magga.
---

# Magga Metadata Curation Skill

This skill documents the complete procedure and operational rules for researching, curating, proposing, and applying manga and author metadata in Magga via the `magga` MCP server.

---

## 1. Social Channel Labeling Rule (Critical Lesson)

When specifying `social_links` in a proposal or author edit:

- **NEVER use generic platform names as labels** (e.g. do NOT use `"X (Twitter)"`, `"BOOTH"`, `"Pixiv"`, or `"Bluesky"`).
- **Reason**: Magga's UI already renders the platform icon directly next to the button. Displaying the platform name creates redundant and unhelpful UI ("X icon + X (Twitter)").
- **ALWAYS use the author's researched profile display name or handle on that specific platform**:
  - **X (Twitter)**: Author's account display name (e.g. `JECKゼｯｸ짹`) or handle if display name is identical.
  - **BOOTH**: Author's circle or shop name (e.g. `hotokupai`).
  - **Pixiv**: Author's user display name on Pixiv (e.g. `Jeck`).
  - **Bluesky**: Author's Bluesky display name (e.g. `🥝jECKｾ"ｯｸ짹`).
- **Icons**: Supply valid public HTTPS favicon URLs without query strings (e.g. `https://x.com/favicon.ico`, `https://hotokupai.booth.pm/favicon.ico`, `https://www.pixiv.net/favicon.ico`, `https://web-cdn.bsky.app/static/favicon-32x32.png`).

---

## 2. Manga Visibility (`isHidden`) Requirement

The MCP metadata workflows support hidden manga. Search and edit metadata while preserving the current visibility. A hidden manga is a draft, not an unavailable metadata target. Never publish or unhide a manga merely to make metadata tools work; publication requires an explicit user instruction.

---

## 3. Author Identity & Credit Research

Kemono, BL, Furry, and Doujin manga often have multiple credits. Always distinguish:

1. **Artist Pen Name (Primary Author)**:
   - Look at the cover typography, front matter, and colophon / ending credit pages.
   - Example: On page colophons, look for "present by 짹 (J)" → `jECK`.
   - Use the artist pen name as `Author.name` in Magga (e.g. `jECK`).
2. **Circle / Publisher Name**:
   - Look for circle logos, booth shop names, or event badges (e.g. "호떡파이" / `hotokupai` on BOOTH).
   - This should be listed under the BOOTH social link label, NOT as the author name unless the artist published purely under the circle name.
3. **Scanlation Credits**:
   - Chinese/Thai scanlation headers (e.g. "图源", "翻译", "嵌字") denote raw providers, translators, and typesetters, NOT the original manga author. Do not mistake scanlators for the author.
4. **Source URLs**:
   - Sources must be clean public HTTPS URLs without query parameters (`?`) or hash fragments (`#`).
   - Confidence should be between `0.9` and `1.0` for direct profile links and official shop items.

---

## 4. MCP Tools & Workflow Reference

### Step 1: Discover Target Manga
1. Call `find_manga({ query: "<Manga Title>" })`.
2. If empty, verify the title or manga UUID and tool access. Preserve `isHidden`; hidden manga are supported.
3. Call `get_manga_details({ manga_id: "<UUID>" })` to retrieve current `authorId`, `categoryId`, and assigned `tags`.

### Step 2: Check Existing Authors
1. Call `find_author({ query: "<Artist Name>" })`.
2. If author already exists:
   - Use `create_metadata_draft` with `kind: "manga_metadata"` and proposal `{ author_id: "<Existing Author UUID>" }`.
3. If author does not exist:
   - Use `create_metadata_draft` with `kind: "manga_author"` to create author and link to manga in one atomic approval.

### Step 3: Create Metadata Draft (`create_metadata_draft`)
Provide:
- `request_id`: Fresh UUID v4 (reuse only on retry).
- `kind`: `"manga_author"` (or `"author_links"`, `"manga_tags"`, `"manga_metadata"`).
- `target`: `{ "type": "manga", "id": "<Manga UUID>" }`.
- `proposal`:
  ```json
  {
    "name": "jECK",
    "social_links": [
      {
        "url": "https://x.com/jeck_kr",
        "label": "JECKゼｯｸ짹",
        "icon": "https://x.com/favicon.ico"
      },
      {
        "url": "https://hotokupai.booth.pm/",
        "label": "hotokupai",
        "icon": "https://hotokupai.booth.pm/favicon.ico"
      },
      {
        "url": "https://www.pixiv.net/users/2184521",
        "label": "Jeck",
        "icon": "https://www.pixiv.net/favicon.ico"
      },
      {
        "url": "https://bsky.app/profile/jjeck.bsky.social",
        "label": "🥝jECKｾ\"ｯｸ짹",
        "icon": "https://web-cdn.bsky.app/static/favicon-32x32.png"
      }
    ]
  }
  ```
- `sources`:
  ```json
  [
    { "url": "https://hotokupai.booth.pm/", "confidence": 0.95 },
    { "url": "https://x.com/jeck_kr", "confidence": 0.95 }
  ]
  ```

### Step 4: Review Draft (`get_metadata_draft`)
1. Call `get_metadata_draft({ draft_id: "<Draft UUID>" })`.
2. Inspect `status` (`pending`), `proposal`, `current`, and copy the 64-character SHA-256 `review_token`.

### Step 5: Apply Draft (`apply_metadata_draft`)
1. Call `apply_metadata_draft({ draft_id: "<Draft UUID>", review_token: "<Token>", confirm: true })`.
2. This atomically:
   - Creates the author in `authors`.
   - Populates `social_links` JSON.
   - Sets `manga.author_id`.
   - Triggers server cache invalidation (`cache_refresh_pending: false`).

### Step 6: Post-Apply Verification & Consistency
1. Verify via `get_manga_details({ manga_id })` to confirm `authorId` is populated.
2. Verify via `get_author_details({ author_id })`.
3. Verify displayed author credits through the application. Use the supported metadata workflow for corrections; do not bypass it with direct database writes.
