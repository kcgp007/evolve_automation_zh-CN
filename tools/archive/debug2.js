const src = `importExportNode.append(' <button id="script_settingsImport" class="button">Import Script Settings</button>');`;
const litRe = /(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
let m;
let n = 0;
while ((m = litRe.exec(src)) !== null) {
    n++;
    console.log('match', n, JSON.stringify(m[1].slice(0, 60)));
}
console.log('total:', n);
