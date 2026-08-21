import {playwrightLauncher} from '@web/test-runner-playwright';

const page = bundle => testFramework => `<!doctype html>
<html>
<body>
    <script src="${bundle}"></script>
    <script type="module" src="${testFramework}"></script>
</body>
</html>`;

export default {
    nodeResolve: {browser: true},
    browsers: [playwrightLauncher({product: 'chromium'})],
    groups: [
        {name: 'globals', files: 'test/browser.test.js', testRunnerHtml: page('/dist/globals.js')},
        {name: 'globals:modern', files: 'test/browser.test.js', testRunnerHtml: page('/dist/globals.modern.js')}
    ]
};
