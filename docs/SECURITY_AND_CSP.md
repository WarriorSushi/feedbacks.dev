# Security, SRI, and CSP

## Subresource Integrity (SRI)

When embedding the widget, add SRI for JS and CSS:

```
<script src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-<VERSION>.js" integrity="sha384-<HASH>" crossorigin="anonymous" defer></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-<VERSION>.css" integrity="sha384-<HASH>" crossorigin="anonymous">
```

Generate SRI after building:

```
node -e "const fs=require('fs');const crypto=require('crypto');const p=>{const d=fs.readFileSync(p);const h=crypto.createHash('sha384').update(d).digest('base64');console.log(p,'sha384-'+h)}; p('packages/widget/dist/widget-<VERSION>.js'); p('packages/widget/dist/widget-<VERSION>.css');"
```

Replace `<VERSION>` and `<HASH>` accordingly.

## Recommended CSP

Start with:

```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://cdn.feedbacks.dev 'sha256-...';
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.feedbacks.dev;
connect-src 'self' https://app.feedbacks.dev https://<your-app-domain> https://<your-supabase-url>;
img-src 'self' data:;
font-src 'self' data:;
frame-ancestors 'self';
```

Adjust `connect-src` to include your API host and Supabase URL. If you inline the snippet, add a matching `sha256-` hash for the inline init.

