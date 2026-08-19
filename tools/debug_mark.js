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
        <label title="When enabled script will be allowed to assign some crates and containers even if resulting storage space won't be enough to build new building. It allows to pre-build stock of resources for further use, but can be potentially dungerous.\nIf script not allowed to reassign non-empty storage it can lock storage in position when stored resources can't be used.\nIf script is allowed to reassign non-empty storage it might waste time producing materials which might need to be disposed.">
          <span>Assign partial storage</span>
        </label>
      </div>
      <div>
        <span>Assign governor task</span>
      </div>`;
    d.body.appendChild(root);

    setTimeout(() => {
        const span1 = root.querySelector('label span');
        const span2 = root.querySelectorAll('div > span')[0];
        console.log('span1 text:', JSON.stringify(span1.textContent));
        console.log('span1 mark:', span1.getAttribute('data-evolve-zh'));
        console.log('label mark:', root.querySelector('label').getAttribute('data-evolve-zh'));
        console.log('label title:', JSON.stringify(root.querySelector('label').getAttribute('title').slice(0, 40)));
        console.log('span2 text:', JSON.stringify(span2.textContent));
        console.log('span2 mark:', span2.getAttribute('data-evolve-zh'));
        console.log('span2 parent mark:', span2.parentElement.getAttribute('data-evolve-zh'));
        process.exit(0);
    }, 3000);
}, 3500);
