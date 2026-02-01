# Troubleshooting

## Dev Server Shows Cryptic Errors

**Symptoms:**
- Build passes but dev server fails at runtime
- Error: "Cannot read properties of undefined (reading 'data')"
- Error mentions `content/runtime.js`
- Duplicate ID warnings in console

**Fix:**
```bash
npm run dev:clean
```

This clears the Astro cache (`.astro/`) and restarts the dev server.

## Other Common Issues

### MDX Compilation Errors
Run `npm run crux -- validate compile` to see which files have syntax errors.

### EntityLink Not Found
Run `npm run crux -- validate unified --rules=entitylink-ids` to find broken references.
