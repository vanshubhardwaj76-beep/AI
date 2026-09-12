// Minimal ESM loader for tests: resolves "@/..." to src and stubs native modules.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STUBS = {
  'react-native': `export const Platform = { OS: 'test', select: (o) => o.default ?? o.test };`,
  'expo-haptics': `export const impactAsync = async () => {}; export const notificationAsync = async () => {}; export const selectionAsync = async () => {}; export const ImpactFeedbackStyle = {}; export const NotificationFeedbackType = {};`,
  '@react-native-async-storage/async-storage': `export default { multiGet: async () => [], setItem: async () => {}, getAllKeys: async () => [], multiRemove: async () => {} };`,
  '@supabase/supabase-js': `export const createClient = () => null;`,
};

function tryExt(p) {
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile()) return p + ext;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (STUBS[specifier]) return { url: 'stub:' + specifier, shortCircuit: true };
  if (specifier.startsWith('@/')) {
    const p = tryExt(path.join(root, 'src', specifier.slice(2)));
    if (p) return { url: pathToFileURL(p).href, shortCircuit: true };
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const base = path.dirname(fileURLToPath(context.parentURL));
    const p = tryExt(path.resolve(base, specifier));
    if (p) return { url: pathToFileURL(p).href, shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith('stub:')) return { format: 'module', source: STUBS[url.slice(5)], shortCircuit: true };
  if (url.startsWith('file:') && /\.tsx?$/.test(url)) {
    const source = fs.readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module-typescript', source, shortCircuit: true };
  }
  return next(url, context);
}
