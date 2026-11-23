import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  iriSectionFromDeepLink,
  stage1SectionFromDeepLink,
  stage1TeamValidationField,
} from './stage1AccordionState';

test('Stage 1 starts compact and opens an explicit section deep link', () => {
  assert.equal(stage1SectionFromDeepLink('', ''), '');
  assert.equal(stage1SectionFromDeepLink('?stage1Section=teams_equipment'), 'teams_equipment');
  assert.equal(stage1SectionFromDeepLink('', '#stage1-calibrations'), 'calibrations');
  assert.equal(stage1SectionFromDeepLink('?stage1IriSection=kalibrasi-awal'), 'overview');
});

test('IRI deep links select only a known nested section', () => {
  const sections = ['Kalibrasi Awal', 'Validasi'];
  assert.equal(iriSectionFromDeepLink('?stage1IriSection=kalibrasi-awal', sections), 'Kalibrasi Awal');
  assert.equal(iriSectionFromDeepLink('?stage1IriSection=unknown', sections), '');
});

test('team validation errors map to the relevant field for focus', () => {
  assert.equal(stage1TeamValidationField('Nama tim wajib diisi.'), 'nama_tim');
  assert.equal(stage1TeamValidationField('Penyedia Jasa tidak sah.'), 'penyedia_id');
  assert.equal(stage1TeamValidationField('Jenis survei tidak sah.'), 'jenis_survei_id');
  assert.equal(stage1TeamValidationField('Layanan tidak tersedia.'), null);
});

test('authenticated Stage 1 uses single-open mounted accordions for state preservation', async () => {
  const source = await readFile(new URL('./ServerStage1DirahWorkspace.tsx', import.meta.url), 'utf8');
  const iri = await readFile(new URL('./Stage1IriDraftChecklist.tsx', import.meta.url), 'utf8');
  assert.match(source, /Accordion type="single" collapsible value=\{activeTab\}/);
  assert.equal((source.match(/<AccordionContent forceMount/g) ?? []).length, 3);
  assert.doesNotMatch(source, /activeTab === '(overview|teams_equipment|calibrations)' &&/);
  assert.match(source, /useEffect\(\(\) => \{\s*if \(!teamError\) return;[\s\S]*?target\?\.focus\(\)/);
  assert.match(source, /setActiveTab\('teams_equipment'\);[\s\S]*?stage1TeamValidationField/);
  assert.match(iri, /Accordion type="single" collapsible value=\{openSection\}/);
  assert.match(iri, /<AccordionContent forceMount/);
});
