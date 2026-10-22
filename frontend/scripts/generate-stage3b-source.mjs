
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const INPUT = path.join(
  ROOT,
  'Migration_4E_4G_QAQC.sql',
);

const OUTPUT = path.join(
  ROOT,
  'frontend/src/workflow/stage3bChecklistData.generated.ts',
);

const PHASE_MAP = {
  KONSISTENSI: 'consistency',
  VALIDASI_INTERNAL: 'internal',
  VERIFIKASI_2_MINGGUAN: 'periodic14',
};

const SURVEY_MAP = {
  IRI: 'IRI',
  PCI_MANUAL: 'PCI Manual',
  PCI_AI: 'PCI AI',
  LENDUTAN: 'Lendutan',
  JEMBATAN: 'Jembatan',
  LERENG: 'Lereng',
  DRAINASE: 'Drainase',
  LALU_LINTAS: 'Lalu Lintas',
  RNI: 'RNI',
};

if (!fs.existsSync(INPUT)) {
  throw new Error('Migration_4E_4G_QAQC.sql tidak ditemukan');
}

const sql = fs.readFileSync(INPUT, 'utf8');

function splitFields(source) {
  const fields = [];
  let current = '';
  let quoted = false;
  let depth = 0;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (char === "'") {
      current += char;

      if (quoted && source[i + 1] === "'") {
        current += "'";
        i++;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (!quoted) {
      if ('([{'.includes(char)) depth++;
      if (')]}'.includes(char)) depth--;

      if (char === ',' && depth === 0) {
        fields.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) fields.push(current.trim());
  return fields;
}

function decode(raw) {
  if (raw == null) return null;

  const value = String(raw)
    .trim()
    .replace(/::(?:jsonb|json|text)\s*$/i, '');

  if (/^null$/i.test(value)) return null;
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  return value;
}

function decodeJson(raw, fallback) {
  const value = decode(raw);
  if (value == null) return fallback;

  if (typeof value !== 'string') return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const insertRegex =
  /insert\s+into\s+public\.qaqc_checklist_item\s*\(([\s\S]*?)\)\s*select\s+id_template\s*,([\s\S]*?)\s+from\s+public\.qaqc_checklist_template\s+where\s+([\s\S]*?)\s+on\s+conflict\s+do\s+nothing\s*;/gi;

const templates = new Map();

let match;
let count = 0;

while ((match = insertRegex.exec(sql)) !== null) {
  const columns = splitFields(match[1])
    .map(value => value.replaceAll('"', '').trim())
    .filter(value => value !== 'id_template');

  const values = splitFields(match[2]);
  const where = match[3];

  const version = where.match(/\bversi\s*=\s*'([^']+)'/i)?.[1];
  const activity =
    where.match(/\bkode_kegiatan\s*=\s*'([^']+)'/i)?.[1];

  if (!version || !activity) continue;

  const survey = SURVEY_MAP[version];
  const phase = PHASE_MAP[activity];

  if (!survey || !phase) continue;

  if (columns.length !== values.length) {
    throw new Error(
      `Jumlah kolom/nilai berbeda pada ${version}/${activity}: ` +
      `${columns.length}/${values.length}`,
    );
  }

  const row = Object.fromEntries(
    columns.map((column, index) => [column, values[index]]),
  );

  const code = String(decode(row.kode_item) ?? '');
  const label = String(decode(row.pertanyaan) ?? '');

  if (!code || !label) {
    throw new Error(`Item tanpa kode/label: ${version}/${activity}`);
  }

  const key = `${survey}:${phase}`;

  if (!templates.has(key)) {
    templates.set(key, {
      id: `stage3b-${version.toLowerCase()}-${phase}`,
      survey,
      phase,
      items: [],
    });
  }

  const rawOptions = decodeJson(row.opsi, []);
  const metadata = decodeJson(row.metadata, {});
  const rule = decodeJson(row.parameter_rule, {});

  templates.get(key).items.push({
    code,
    label,
    section: String(decode(row.section) ?? 'Pemeriksaan'),
    inputType: String(decode(row.tipe_input) ?? 'TEXT').toUpperCase(),
    checkType: String(decode(row.check_type) ?? 'MANUAL_CHECK').toUpperCase(),
    options: Array.isArray(rawOptions)
      ? rawOptions.map(String)
      : [],
    required: decode(row.wajib) === true,
    order: Number(decode(row.urutan) ?? 0),
    sourceOrder: Number(decode(row.source_order) ?? 0),
    unit: String(decode(row.satuan) ?? ''),
    metadata: metadata && typeof metadata === 'object'
      ? metadata
      : {},
    rule: rule && typeof rule === 'object'
      ? rule
      : {},
  });

  count++;
}

const output = [...templates.values()]
  .map(template => ({
    ...template,
    items: template.items.sort(
      (a, b) => a.order - b.order || a.sourceOrder - b.sourceOrder,
    ),
  }))
  .sort(
    (a, b) =>
      a.survey.localeCompare(b.survey) ||
      a.phase.localeCompare(b.phase),
  );

if (!output.length) {
  throw new Error(
    'Tidak ada data Tahap 3B yang ditemukan. Generator dihentikan.',
  );
}

for (const template of output) {
  const codes = template.items.map(item => item.code);
  if (new Set(codes).size !== codes.length) {
    throw new Error(`Kode item duplikat: ${template.id}`);
  }
}

const declaration = `
/* Dibangkitkan dari migration QA/QC. Jangan diedit manual. */

export type Stage3BPhase =
  | 'consistency'
  | 'internal'
  | 'periodic14';

export type Stage3BItem = {
  code: string;
  label: string;
  section: string;
  inputType: string;
  checkType: string;
  options: string[];
  required: boolean;
  order: number;
  sourceOrder: number;
  unit: string;
  metadata: Record<string, unknown>;
  rule: Record<string, unknown>;
};

export type Stage3BTemplate = {
  id: string;
  survey: string;
  phase: Stage3BPhase;
  items: Stage3BItem[];
};

`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

fs.writeFileSync(
  OUTPUT,
  declaration +
    'export const STAGE3B_TEMPLATES: Stage3BTemplate[] = ' +
    JSON.stringify(output, null, 2) +
    ';\n',
  'utf8',
);

console.log('\nTAHAP 3B — HASIL GENERATE');
console.log(`Total item: ${count}`);
console.log(`Total template: ${output.length}`);

for (const template of output) {
  console.log(
    `${template.survey.padEnd(12)} ` +
    `${template.phase.padEnd(12)} ` +
    `${template.items.length} item`,
  );
}

console.log(`\nOutput: ${OUTPUT}`);
console.log('SQL hanya dibaca. Supabase tidak diubah.');
