# FL0W3R

A botanical browser-style start page with DuckDuckGo search and an embedded website viewer.

## Run locally (Windows PowerShell)

1. Install Node.js.
2. Open PowerShell in this folder.
3. Run:

```powershell
   npm.cmd install
   npm.cmd start
   ```

4. Visit http://localhost:3000

## GitHub Pages

GitHub Pages can host the static files in `public/`. In your repository settings, choose **Pages**, select the branch and `/public` folder if available (or move the contents of `public/` to the repository root).

The Express server is only for local testing. GitHub Pages does not run `server.js`.

## Important compatibility limitation

This project is a normal website, not a full Chromium browser. A site can prevent embedding with browser security headers such as `X-Frame-Options` or Content Security Policy (`frame-ancestors`). A webpage cannot override those protections. Some sites will therefore need to open in a separate tab.

A true remote-browser experience requires a separately hosted browser service and a secure connection to it. That service is not included or configured here, because it needs its own hosting, authentication, and deployment settings. GitHub Pages alone cannot run it. Do not put private service tokens in `public/config.js`.

