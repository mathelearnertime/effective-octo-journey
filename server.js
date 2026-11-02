const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const path = require('path');

const app = express();
const PORT = 3000;

function getAbsoluteUrl(base, relative) {
    if (!relative) return null;
    try {
        return new URL(relative, base).href;
    } catch (e) {
        return relative;
    }
}

app.get('/proxy/:url(.*)', async (req, res) => {
    let targetUrl = req.params.url;
    targetUrl = decodeURIComponent(targetUrl);
    
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000,
            responseType: 'text'
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Strip blocking headers
        $('meta[http-equiv="X-Frame-Options"]').remove();
        $('meta[http-equiv="Content-Security-Policy"]').remove();
        
        // Inject helper script for client-side navigation
        const helperScript = `
<script>
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
        e.preventDefault();
        window.location.href = '/proxy/' + encodeURIComponent(link.href);
    }
}, true);
</script>`;
        $('head').append(helperScript);

        // Rewrite links
        $('a[href]').each((i, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                const absUrl = getAbsoluteUrl(targetUrl, href);
                if (absUrl) {
                    $(link).attr('href', `/proxy/${encodeURIComponent(absUrl)}`);
                }
            }
        });

        // Images
        $('img[src]').each((i, img) => {
            const src = $(img).attr('src');
            if (src) {
                const absUrl = getAbsoluteUrl(targetUrl, src);
                if (absUrl) {
                    $(img).attr('src', `/proxy-img/${encodeURIComponent(absUrl)}`);
                }
            }
        });

        // Stylesheets
        $('link[rel="stylesheet"]').each((i, link) => {
            const href = $(link).attr('href');
            if (href) {
                const absUrl = getAbsoluteUrl(targetUrl, href);
                if (absUrl) {
                    $(link).attr('href', `/proxy-css/${encodeURIComponent(absUrl)}`);
                }
            }
        });

        // Scripts
        $('script[src]').each((i, script) => {
            const src = $(script).attr('src');
            if (src) {
                const absUrl = getAbsoluteUrl(targetUrl, src);
                if (absUrl) {
                    $(script).attr('src', `/proxy-js/${encodeURIComponent(absUrl)}`);
                }
            }
        });

        res.send($.html());

    } catch (error) {
        res.status(500).send(`Error loading site: ${error.message}`);
    }
});

// Proxy binary assets
app.get('/proxy-img/:url(.*)', async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.send(response.data);
    } catch (e) {
        res.sendStatus(500);
    }
});

// Proxy CSS
app.get('/proxy-css/:url(.*)', async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const response = await axios.get(url);
        const css = response.data;
        
        // Rewrite relative URLs in CSS
        const rewrittenCss = css.replace(/url\(['"]?(.*?)['"]?\)/g, (match, assetPath) => {
            const absAsset = getAbsoluteUrl(url, assetPath);
            if (absAsset) {
                return `url('/proxy-img/${encodeURIComponent(absAsset)}')`;
            }
            return match;
        });

        res.set('Content-Type', 'text/css');
        res.send(rewrittenCss);
    } catch (e) {
        res.sendStatus(500);
    }
});

// Proxy JS
app.get('/proxy-js/:url(.*)', async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const response = await axios.get(url);
        res.set('Content-Type', 'application/javascript');
        res.send(response.data);
    } catch (e) {
        res.sendStatus(500);
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`FL0W3R Proxy running at http://localhost:${PORT}`);
});