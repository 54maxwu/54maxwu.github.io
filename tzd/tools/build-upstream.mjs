import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(root + 'vendor/generated', { recursive:true });
const entry = `
export * from './lib/ziwei/algorithm';
export * from './lib/ziwei/patterns';
export * from './lib/ziwei/sihua';
export * from './lib/ziwei/true-solar-time';
export * from './lib/ziwei/shier-shen';
export * from './lib/ziwei/school-config';
export * from './lib/ziwei/dst-cn';
export * from './lib/ziwei/heming-knowledge';
export { astro } from 'iztro';
`;
const options = {
  bundle:true, format:'esm', platform:'browser', target:'es2022', minify:true,
  nodePaths:[root + 'tools/node_modules'], legalComments:'inline',
  plugins:[{name:'pure-browser-rules', setup(b) {
    b.onResolve({filter:/^server-only$/}, () => ({path:'server-only',namespace:'empty'}));
    b.onLoad({filter:/.*/,namespace:'empty'}, () => ({contents:'',loader:'js'}));
  }}],
};
await build({...options, stdin:{contents:entry,resolveDir:root+'vendor/ziwei-doushu',loader:'ts'}, outfile:root+'vendor/generated/ziwei.js'});
await build({...options,entryPoints:[root+'vendor/ziwei-doushu/lib/classics/index.ts'],outfile:root+'vendor/generated/classics.js'});
await build({...options,entryPoints:[root+'tools/chinese-entry.mjs'],outfile:root+'vendor/generated/chinese.js'});
console.log('Upstream browser modules built');
