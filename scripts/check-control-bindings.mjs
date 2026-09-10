// Verifies that every interactive control in src/**/*.svelte is wired to
// reactive state. A <Slider> without bind:value, a <RadioButton> without
// bind:groupValue, a <Toggle> without bind:checked (or onchange), or a
// <Dial> without bind:value (or onchange) still renders — but moving it has
// no effect on the demo. That failure mode is silent, so this script parses
// every .svelte file with the Svelte compiler and fails the lint step.
//
// Usage: node scripts/check-control-bindings.mjs

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'svelte/compiler';

const ROOT = 'src';

// Files where <Dial> instances are intentionally static (fixed value, no
// state, no onchange) — e.g. the component showcase page.
const STATIC_DIAL_FILES = new Set(['src/routes/demo/controls/+page.svelte']);

// component name -> { bind: required binding name, orAttr: alternative attr, bindableOnly: no callback alternative }
const RULES = {
	Slider: { bind: 'value', bindableOnly: true },
	RadioButton: { bind: 'groupValue', bindableOnly: true },
	Toggle: { bind: 'checked', orAttr: 'onchange' },
	Dial: { bind: 'value', orAttr: 'onchange' }
};

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory() && !entry.name.startsWith('.')) walk(p, out);
		else if (entry.name.endsWith('.svelte')) out.push(p);
	}
	return out;
}

function each(node, fn) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const child of node) each(child, fn);
		return;
	}
	fn(node);
	for (const key of Object.keys(node)) {
		const value = node[key];
		if (value && typeof value === 'object') each(value, fn);
	}
}

function lineOf(source, pos) {
	return source.slice(0, pos).split('\n').length;
}

let failures = 0;
let checked = 0;

for (const file of walk(ROOT)) {
	const source = fs.readFileSync(file, 'utf8');
	let ast;
	try {
		ast = parse(source, { filename: file });
	} catch (err) {
		console.error(`✗ ${file}: parse error — ${err.message}`);
		failures++;
		continue;
	}

	each(ast, (node) => {
		if (node.type !== 'InlineComponent' || !(node.name in RULES)) return;
		if (node.name === 'Dial' && STATIC_DIAL_FILES.has(file)) return;

		const rule = RULES[node.name];
		const attrs = new Set();
		const binds = new Set();
		for (const a of node.attributes ?? []) {
			if (a.type === 'Attribute') attrs.add(a.name);
			else if (a.type === 'Binding') binds.add(a.name);
		}

		checked++;
		const ok = binds.has(rule.bind) || (rule.orAttr && attrs.has(rule.orAttr));
		if (ok) return;

		const line = lineOf(source, node.start);
		const hint = rule.bindableOnly
			? `bind:${rule.bind} is missing — the ${node.name} renders but has no effect`
			: `neither bind:${rule.bind} nor ${rule.orAttr} — the ${node.name} renders but has no effect`;
		console.error(`✗ ${file}:${line} — <${node.name}>: ${hint}`);
		failures++;
	});
}

if (failures > 0) {
	console.error(`\n${failures} unbound control(s) found.`);
	process.exit(1);
}
console.log(`✓ ${checked} Slider/RadioButton/Toggle/Dial usages are all bound to state`);
