const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

// 1. Globally replace bg-secondary-50 with bg-white
walk('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content.replace(/bg-secondary-50/g, 'bg-white');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated bg-secondary-50 in:', filePath);
    }
  }
});

// 2. Fix src/app/register/provider/page.tsx specifically
const providerRegisterPath = 'src/app/register/provider/page.tsx';
let content = fs.readFileSync(providerRegisterPath, 'utf-8');

content = content.replace('bg-secondary-900 p-4 py-12', 'bg-white p-4 py-12');
content = content.replace('brightness-0 invert', '');
content = content.replace('bg-secondary-800 border-secondary-700 text-secondary-50', 'bg-white border-secondary-200 text-secondary-900 shadow-xl');
content = content.replace('text-2xl text-white', 'text-2xl text-secondary-900');
content = content.replace('text-secondary-400', 'text-secondary-500');
content = content.replace('bg-red-900/50 text-red-200 text-sm rounded-xl border border-red-800', 'bg-red-50 text-red-600 text-sm rounded-xl border border-red-200');

// Fix Inputs
content = content.replace(/text-secondary-300 block mb-1/g, 'text-secondary-700 block mb-1');
content = content.replace(/bg-secondary-900 border-secondary-700 text-white placeholder:text-secondary-600 focus-visible:ring-primary-500/g, 'bg-white border-secondary-300 text-secondary-900 placeholder:text-secondary-400 focus-visible:ring-primary-500');
content = content.replace(/bg-secondary-900 border-secondary-700 text-white px-3/g, 'bg-white border-secondary-300 text-secondary-900 px-3');
content = content.replace(/text-secondary-400 mt-1/g, 'text-secondary-500 mt-1');
content = content.replace(/text-secondary-300 mb-2/g, 'text-secondary-700 mb-2');
content = content.replace(/text-primary-400 hover:underline/g, 'text-primary-600 hover:underline');
content = content.replace(/text-primary-400 font-medium hover:underline/g, 'text-primary-600 font-medium hover:underline');
content = content.replace(/text-secondary-400">/g, 'text-secondary-500">');

fs.writeFileSync(providerRegisterPath, content);
console.log('Fixed provider register dark theme');
