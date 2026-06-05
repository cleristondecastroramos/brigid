const fs = require('fs');
const path = 'src/routes/diagnostico.tsx';
let content = fs.readFileSync(path, 'utf8');

const map = {
  'text-[10px]': 'text-xs',
  'text-[11px]': 'text-sm',
  'text-[12px]': 'text-sm',
  'text-[13px]': 'text-[15px]',
  'text-xs': 'text-sm',
  'text-sm': 'text-base',
  'text-base': 'text-lg',
  'text-lg': 'text-xl'
};

content = content.replace(/text-\[10px\]|text-\[11px\]|text-\[12px\]|text-\[13px\]|\btext-xs\b|\btext-sm\b|\btext-base\b|\btext-lg\b/g, (match) => map[match] || match);

fs.writeFileSync(path, content, 'utf8');
console.log('Fontes ajustadas com sucesso.');
