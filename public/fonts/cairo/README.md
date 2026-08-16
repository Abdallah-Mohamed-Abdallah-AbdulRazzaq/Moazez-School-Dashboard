# Cairo Font Files

This directory should contain the Cairo font files for offline builds.

## Required Files

Download the following files from [Google Fonts](https://fonts.google.com/specimen/Cairo):

1. `Cairo-Regular.ttf` (weight: 400)
2. `Cairo-Medium.ttf` (weight: 500)
3. `Cairo-SemiBold.ttf` (weight: 600)
4. `Cairo-Bold.ttf` (weight: 700)

## How to Download

### Option 1: Direct Download from Google Fonts

1. Visit https://fonts.google.com/specimen/Cairo
2. Click "Download family" button
3. Extract the ZIP file
4. Copy the following files to this directory:
   - `Cairo-Regular.ttf`
   - `Cairo-Medium.ttf`
   - `Cairo-SemiBold.ttf`
   - `Cairo-Bold.ttf`

### Option 2: Using Google Webfonts Helper

1. Visit https://gwfh.mranftl.com/fonts/cairo
2. Select the character sets you need (latin, arabic)
3. Select the font weights: 400, 500, 600, 700
4. Download the files
5. Copy the `.ttf` files to this directory

### Option 3: Using npm package (if available)

```bash
npm install @fontsource/cairo
```

Then copy the font files from `node_modules/@fontsource/cairo/files/` to this directory.

## Verification

After adding the font files, your directory structure should look like:

```
public/fonts/cairo/
├── Cairo-Regular.ttf
├── Cairo-Medium.ttf
├── Cairo-SemiBold.ttf
├── Cairo-Bold.ttf
└── README.md
```

## Why Local Fonts?

Using local fonts instead of Google Fonts CDN provides:

- **Offline builds**: No internet connection required during build time
- **Deterministic builds**: Same build output every time
- **Better performance**: No external font loading
- **Privacy**: No requests to Google servers
- **Reliability**: No dependency on external services
