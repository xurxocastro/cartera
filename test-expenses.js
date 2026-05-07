const fs = require('fs');
let code = fs.readFileSync('expenses.js', 'utf8');
code = code.replace(/const state = /g, 'global.state = ');
code = code.replace(/const els = /g, 'global.els = ');
code = code.replace(/const SEED_DATA/g, 'global.SEED_DATA');

const document = {
  getElementById: (id) => ({ id, classList: { add: ()=>{}, remove: ()=>{} }, style: {}, appendChild: ()=>{}, innerHTML: '' }),
  createElement: () => ({ classList: { add: ()=>{}, remove: ()=>{} }, style: {}, appendChild: ()=>{}, innerHTML: '' }),
  addEventListener: () => {}
};
const localStorage = { getItem: () => null, setItem: () => {} };
const window = {};

global.document = document;
global.localStorage = localStorage;
global.window = window;
global.crypto = { subtle: {} };

try {
  eval(code);
  cacheElements();
  console.log("Cached elements successfully.");
  global.state.entries = global.SEED_DATA;
  render();
  console.log("Render completed successfully.");
} catch (e) {
  console.error("ERROR CAUGHT:", e);
}
