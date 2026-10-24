/**
 * Deploys the billing Edge Functions once the Supabase CLI is logged in.
 * Usage: node scripts/billing/deploy.mjs
 */
import { spawn } from 'node:child_process';

const functions = [
    'create-checkout-session',
    'create-portal-session',
    'create-invoice',
    'stripe-webhook',
];

function run(args) {
    return new Promise((resolve) => {
        const child = spawn('npx', ['supabase', ...args], { stdio: 'inherit', shell: true });
        child.on('exit', (code) => resolve(code ?? 1));
    });
}

const linked = await run(['projects', 'list']);
if (linked !== 0) {
    console.log('Supabase CLI is not logged in. After `npx supabase login` and `npx supabase link`, re-run this script.');
    console.log('Then set secrets:');
    console.log('  npx supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...');
    process.exit(0);
}

let failed = 0;
for (const name of functions) {
    const code = await run(['functions', 'deploy', name]);
    if (code !== 0) failed = code;
}
process.exit(failed);
