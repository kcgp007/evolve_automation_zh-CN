#!/usr/bin/env node
// check_upstream.js — 检查三个上游文件是否最新，必要时同步原脚本。
// 用法: node tools/check_upstream.js
//   1) evolve_automation.user.js   对比 GitHub master blob sha，不一致则自动覆盖
//   2) tools/official_en.json      对比在线 strings.json，仅报告差异
//   3) tools/official_zh.json      对比在线 strings.zh-CN.json，仅报告差异
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const USERJS = path.join(ROOT, 'evolve_automation.user.js');
const EN_LOCAL = path.join(__dirname, 'official_en.json');
const ZH_LOCAL = path.join(__dirname, 'official_zh.json');

const SCRIPT_URL = 'https://api.github.com/repos/Vollch/Evolve-Automation/contents/evolve_automation.user.js?ref=master';
const EN_URL = 'https://pmotschmann.github.io/Evolve/strings/strings.json';
const ZH_URL = 'https://pmotschmann.github.io/Evolve/strings/strings.zh-CN.json';

const UA = { 'User-Agent': 'opencode-check', Accept: 'application/vnd.github.raw' };

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: UA, timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        resolve(fetch(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout ' + url)); });
    req.on('error', (e) => reject(e));
  });
}

function gitBlobSha(buf) {
  return crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

function versionOf(buf) {
  const m = buf.toString('utf8').match(/@version\s+([0-9][0-9.]*)/);
  return m ? m[1] : '?';
}

function keysOf(json) {
  try { return Object.keys(JSON.parse(json)); } catch (e) { return null; }
}

async function checkScript() {
  console.log('[1/3] evolve_automation.user.js');
  const remote = await fetch(SCRIPT_URL);
  const remoteSha = gitBlobSha(remote);
  const local = fs.readFileSync(USERJS);
  const localSha = gitBlobSha(local);
  if (remoteSha === localSha) {
    console.log('  OK  最新 (v' + versionOf(remote) + ')');
    return;
  }
  fs.writeFileSync(USERJS, remote);
  console.log('  UPDATED v' + versionOf(local) + ' -> v' + versionOf(remote) +
    ' (' + Math.abs(remote.length - local.length) + ' bytes 差异, 已覆盖本地)');
}

async function checkStrings(name, localPath, url, idx) {
  console.log('[' + idx + '/3] ' + name);
  const remote = await fetch(url);
  const local = fs.readFileSync(localPath, 'utf8');
  const rk = keysOf(remote);
  const lk = keysOf(local);
  if (rk === null || lk === null) { console.log('  ERR JSON 解析失败'); return; }
  const missing = rk.filter((k) => !lk.includes(k));
  const extra = lk.filter((k) => !rk.includes(k));
  if (missing.length === 0 && extra.length === 0) {
    console.log('  OK  键一致 (' + rk.length + ' 键, 与本地一致)');
    return;
  }
  console.log('  DIFF 在线新增 ' + missing.length + ' 键, 本地独有 ' + extra.length + ' 键');
  if (missing.length) console.log('    新增键示例: ' + missing.slice(0, 5).join(', '));
  if (extra.length) console.log('    本地独有键示例: ' + extra.slice(0, 5).join(', '));
}

(async () => {
  try {
    await checkScript();
    await checkStrings('official_en.json (在线 strings.json)', EN_LOCAL, EN_URL, 2);
    await checkStrings('official_zh.json (在线 strings.zh-CN.json)', ZH_LOCAL, ZH_URL, 3);
    console.log('\n完成。原脚本有更新时请重跑 tools/align_official.js 与 apply_official.js。');
  } catch (e) {
    console.error('失败:', e.message);
    process.exitCode = 1;
  }
})();