---
name: static-assets
description: Add, organize, reference, and validate public files in the static directory.
---

# Static assets

Place public files under `static` in descriptive subdirectories such as `static/pdf`, `static/logos`, or `static/images`. Reference them from pages with root-relative public URLs, for example `/pdf/document.pdf`.

- Do not import files from `static` through `$lib`.
- Preserve case-sensitive filenames and use stable, descriptive names.
- Check that links work in a production build, not only in the dev server.
- Keep downloadable documents and logos separate from source modules.
- Add accessible text, labels, or captions when an asset is exposed in the UI.

Use this skill for PDFs, logos, favicons, illustrations, and other files served unchanged by the application.
