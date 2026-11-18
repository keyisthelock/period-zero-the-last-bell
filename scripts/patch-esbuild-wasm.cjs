// Environment workaround (see BUILD_STATUS.md):
// On the original dev machine Windows Application Control blocks native esbuild/rollup binaries,
// so package.json overrides them with their WebAssembly builds. In that environment Node's
// crypto.randomFillSync throws ERR_OSSL_ENTROPY_SOURCE_STRENGTH_TOO_WEAK inside the Go wasm runtime.
// esbuild only uses randomness for map seeding, so falling back to webcrypto / Math.random is safe.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'node_modules', 'esbuild', 'wasm_exec_node.js');
if (!fs.existsSync(file)) process.exit(0); // native esbuild in use: nothing to do
let src = fs.readFileSync(file, 'utf8');
if (src.includes('PERIODZERO_PATCH')) process.exit(0);
src = src.replace(
  /getRandomValues\(b\) \{\s*crypto\.randomFillSync\(b\);\s*\}/,
  `getRandomValues(b) { /* PERIODZERO_PATCH */
		try { crypto.randomFillSync(b); return; } catch (e) {}
		try { crypto.webcrypto.getRandomValues(b); return; } catch (e) {}
		for (let i = 0; i < b.length; i++) b[i] = (Math.random() * 256) | 0;
	}`
);
fs.writeFileSync(file, src);
console.log('[patch-esbuild-wasm] applied');
