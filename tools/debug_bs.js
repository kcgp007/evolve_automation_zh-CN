const fs = require('fs');
const userjs = fs.readFileSync('/home/king/workspace/evolve_automation_zh-CN/evolve_automation_zh-CN.user.js', 'utf8');
const { JSDOM } = require('/home/king/workspace/evolve_automation_zh-CN/node_modules/jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'outside-only' });
const { window } = dom;
window.confirm = () => true;
window.eval(userjs);
setTimeout(() => {
    const d = window.document;
    const root = d.createElement('div');
    root.id = 'script_settings';
    root.innerHTML = `
      <div>
        <label title="Assigns 3% extra strorage above required amounts, ensuring that required quantity will be actually reached, even if other part of script trying to sell\eject\switch production, etc. When manual trades enabled applies additional adjust derieved from selling threshold.">
          <span>Assign buffer storage</span>
        </label>
      </div>
      <div>
        <span>Occupy last foreign power once other two are controlled, and unification is researched to speed up unification. Disable if you want annex\purchase achievements.</span>
      </div>`;
    d.body.appendChild(root);
    setTimeout(() => {
        const title = root.querySelector('label').getAttribute('title');
        const occ = root.querySelectorAll('div > span')[0].textContent;
        const idx = title.indexOf('即使脚本其他部分试图出售');
        console.log('title translated:', JSON.stringify(title.slice(idx, idx + 30)));
        console.log('occ:', JSON.stringify(occ));
        const bsKey = Object.keys(JSON.parse(title === 'x' ? '{}' : '{}'));
        process.exit(0);
    }, 3000);
}, 3500);
