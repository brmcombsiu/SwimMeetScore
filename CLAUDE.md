# Claude Code Instructions

## Version Bumping

Always bump the app version when making code changes. Update **all three** locations in the same commit:
- `package.json` → `"version"` field
- `app.jsx` → `APP_VERSION` constant
- `index.html` → `"softwareVersion"` in the JSON-LD schema

Use semantic versioning: patch for fixes, minor for features, major for breaking changes.

## Build Process

After editing `app.jsx` or `input.css`, run the build:
```
npm run build
```
This compiles `app.jsx` → `app.js` and `input.css` → `app.css`.

If `tailwindcss` or `babel` aren't found, run `npm install` first.
