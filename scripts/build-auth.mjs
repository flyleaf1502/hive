import { build } from 'esbuild';
import { mkdirSync, copyFileSync } from 'node:fs';
mkdirSync('dist/vendor', { recursive: true });
await build({ entryPoints: ['scripts/auth-entry.js'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: 'dist/vendor/supabase-auth.js', minify: true, legalComments: 'eof' });
copyFileSync('node_modules/@supabase/auth-js/LICENSE', 'dist/vendor/supabase-auth.LICENSE');
