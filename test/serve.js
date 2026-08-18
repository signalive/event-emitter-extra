/**
 * Serves the repository over HTTP and opens test/runner.html in a browser.
 *
 *     npm run serve:browser
 *
 * The page has to reach ../dist and ../node_modules, so the repository root is
 * the document root rather than test/. Serving over HTTP also sidesteps the
 * question of what a given browser allows a file:// page to load.
 *
 * Stays in the foreground; Ctrl-C to stop. Set PORT to pick the starting port.
 * Node's own http module is all this uses -- the browser test path is
 * deliberately dependency-free, see test/browser-harness.js.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const {spawn} = require('child_process');

// Real path, so it can be compared against other real paths: on macOS a repo
// under /tmp already sits behind a symlink.
const ROOT = fs.realpathSync(path.resolve(__dirname, '..'));
const PAGE = '/test/runner.html';
const FIRST_PORT = Number(process.env.PORT) || 8231;
const PORT_ATTEMPTS = 10;

// Allowlist, not a denylist: refusing `..` still left everything inside the
// repository readable, .git/config among it. Only what runner.html actually
// loads is reachable.
const SERVABLE = ['dist', 'test', path.join('node_modules', 'sinon')];

// A browser will send any hostname that resolves here, so a page on another
// origin could point a name it controls at 127.0.0.1 and read the responses.
const ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];

const CONTENT_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8'
};


function insideRoot(file) {
    return file === ROOT || file.indexOf(ROOT + path.sep) === 0;
}


function onAllowlist(file) {
    const relative = path.relative(ROOT, file);

    return SERVABLE.some(prefix =>
        relative === prefix || relative.indexOf(prefix + path.sep) === 0);
}


/**
 * Resolves a request path to a file runner.html is allowed to load, or null.
 * Returning null rather than clamping keeps `..` in a URL from quietly serving
 * something else.
 */
function servableFile(urlPath) {
    let decoded;

    try {
        decoded = decodeURIComponent(urlPath);
    } catch (err) {
        return null;
    }

    if (decoded.indexOf('\0') > -1) return null;

    const resolved = path.resolve(ROOT, '.' + decoded);
    if (!insideRoot(resolved) || !onAllowlist(resolved)) return null;

    // path.resolve is lexical, so the checks above only describe the requested
    // path. A symlink under dist/, test/ or node_modules/sinon -- the last of
    // which is third-party -- would otherwise hand out whatever it points at,
    // anywhere on the filesystem. Verified: a link to /etc/passwd was served
    // with a 200 before this.
    let real;

    try {
        real = fs.realpathSync(resolved);
    } catch (err) {
        // Nothing there to leak; let the read report it as missing rather than
        // masking a plain 404 as a refusal.
        return err.code === 'ENOENT' ? resolved : null;
    }

    if (!insideRoot(real) || !onAllowlist(real)) return null;

    return real;
}


/**
 * The Host header carries whatever name the browser resolved, so checking it is
 * what stops a hostile page from pointing its own domain at this port and
 * reading the responses. The port is not compared, only the host.
 */
function hostAllowed(host) {
    if (!host) return false;

    const hostname = host.charAt(0) === '[' ?
        host.slice(0, host.indexOf(']') + 1) :
        host.split(':')[0];

    return ALLOWED_HOSTS.indexOf(hostname.toLowerCase()) > -1;
}


/**
 * `/` redirects rather than serving the page's bytes, because runner.html loads
 * ./browser-harness.js and ./test.js relative to its own URL. Served at `/`
 * those resolve to /browser-harness.js and /test.js, which are outside the
 * allowlist, and the page comes up blank with a 200.
 */
function redirect(res, location) {
    res.writeHead(302, {Location: location, 'Cache-Control': 'no-store'});
    res.end();
}


function respond(res, status, type, body) {
    res.writeHead(status, {
        'Content-Type': type,
        // The point is to exercise the bundle that was just built.
        'Cache-Control': 'no-store'
    });
    res.end(body);
}


const server = http.createServer((req, res) => {
    if (!hostAllowed(req.headers.host))
        return respond(res, 403, 'text/plain; charset=utf-8', 'Forbidden host');

    const urlPath = req.url.split('?')[0].split('#')[0];

    if (urlPath === '/')
        return redirect(res, PAGE);

    const file = servableFile(urlPath);

    if (!file)
        return respond(res, 403, 'text/plain; charset=utf-8', 'Forbidden');

    fs.readFile(file, (err, body) => {
        if (err)
            return respond(res, 404, 'text/plain; charset=utf-8', 'Not found: ' + urlPath);

        respond(res, 200, CONTENT_TYPES[path.extname(file)] || 'application/octet-stream', body);
    });
});


function openBrowser(url) {
    const command = process.platform === 'darwin' ? 'open' :
        process.platform === 'win32' ? 'start' : 'xdg-open';

    // Detached with stdio ignored so the browser does not hold on to this
    // script's streams. A missing opener is not fatal: the URL is printed too.
    const child = spawn(command, [url], {
        stdio: 'ignore',
        detached: true,
        shell: process.platform === 'win32'
    });

    child.on('error', () => {
        console.log('Could not open a browser automatically -- open the URL above.');
    });

    child.unref();
}


/**
 * Every file runner.html actually fetches, checked individually. Testing the
 * sinon directory rather than the bundle inside it, or only one of the two
 * globals builds, let the server start clean and pushed the failure into the
 * browser where it reads as a mystery.
 */
const REQUIRED = [
    {file: ['dist', 'globals.js'], remedy: 'run `npm run build`'},
    {file: ['dist', 'globals.modern.js'], remedy: 'run `npm run build`'},
    {file: ['node_modules', 'sinon', 'pkg', 'sinon.js'], remedy: 'run `npm install`'}
];


function warnAboutMissingFiles() {
    const missing = REQUIRED.filter(entry => !fs.existsSync(path.join(ROOT, ...entry.file)));

    missing.forEach(entry => console.log(
        'warning: ' + entry.file.join('/') + ' is missing -- ' + entry.remedy));

    if (missing.length) console.log('');
}


let port = FIRST_PORT;
let attemptsLeft = PORT_ATTEMPTS;

server.on('error', err => {
    if (err.code === 'EADDRINUSE' && attemptsLeft-- > 0) {
        port++;
        return server.listen(port, '127.0.0.1');
    }

    console.error(err.message);
    process.exit(1);
});

server.on('listening', () => {
    const url = 'http://127.0.0.1:' + port + PAGE;

    warnAboutMissingFiles();
    console.log('Serving ' + ROOT + '\n');
    console.log('  ' + url + '                 (dist/globals.js)');
    console.log('  ' + url + '?bundle=modern   (dist/globals.modern.js)\n');
    console.log('Results are reported on the page. Ctrl-C to stop.');

    openBrowser(url);
});

server.listen(port, '127.0.0.1');
