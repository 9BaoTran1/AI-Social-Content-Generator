import { spawn } from 'child_process';
import path from 'path';

const distPath = path.resolve('C:/Users/Thinkpad/antigravity/AI-Social-Content-Generator---Order-Siêu-Nhàn/dist');
const domain = 'ordersieunhan-ai.surge.sh';

console.log('Deploying directory:', distPath, 'to', domain);

const child = spawn('npx', ['surge', distPath, domain], {
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (d) => {
  const str = d.toString();
  process.stdout.write(str);
  if (str.includes('email:')) {
    child.stdin.write('ordersieunhan.app@gmail.com\n');
  } else if (str.includes('password:')) {
    child.stdin.write('OrderSieuNhan@2026\n');
  }
});

child.stderr.on('data', (d) => {
  process.stderr.write(d.toString());
});

child.on('close', (code) => {
  console.log('Surge deploy exited with code:', code);
});
