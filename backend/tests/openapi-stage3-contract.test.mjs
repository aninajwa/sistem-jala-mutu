import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const [specText, surveiRoute, cycleRoute, packageRoute, routeIndex, sessionSchema, segmentSchema, prototypeSchema, cycleSchema] = await Promise.all([
  readFile(new URL('../openapi.yaml', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/survei.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/siklus-verval.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/paket.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/schemas/survei.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/schemas/data-segmen.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/schemas/survei.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/schemas/siklus-verval.ts', import.meta.url), 'utf8'),
]);
const spec = parse(specText);

const declared = [
  ['/paket/{id}/sesi-survei', 'get', surveiRoute, "router.get('/paket/:id/sesi-survei'"],
  ['/paket/{id}/sesi-survei', 'post', surveiRoute, "router.post('/paket/:id/sesi-survei'"],
  ['/paket/{id}/sesi-survei/{sesiId}', 'get', surveiRoute, "router.get('/paket/:id/sesi-survei/:sesiId'"],
  ['/paket/{id}/sesi-survei/{sesiId}/data-segmen', 'get', surveiRoute, "router.get('/paket/:id/sesi-survei/:sesiId/data-segmen'"],
  ['/paket/{id}/sesi-survei/{sesiId}/data-segmen', 'post', surveiRoute, "router.post('/paket/:id/sesi-survei/:sesiId/data-segmen'"],
  ['/paket/{id}/sesi-survei/{sesiId}/data-segmen/{dataId}', 'get', surveiRoute, "router.get('/paket/:id/sesi-survei/:sesiId/data-segmen/:dataId'"],
  ['/paket/{id}/pemeriksaan-harian-alat', 'get', surveiRoute, "router.get('/paket/:id/pemeriksaan-harian-alat'"],
  ['/paket/{id}/pemeriksaan-harian-alat', 'post', surveiRoute, "router.post('/paket/:id/pemeriksaan-harian-alat'"],
  ['/paket/{id}/siklus-verval', 'get', cycleRoute, "router.get('/paket/:id/siklus-verval'"],
  ['/paket/{id}/siklus-verval', 'post', cycleRoute, "router.post('/paket/:id/siklus-verval'"],
  ['/paket/{id}/siklus-verval/{siklusId}', 'get', cycleRoute, "router.get('/paket/:id/siklus-verval/:siklusId'"],
  ['/paket/{id}/siklus-verval/{siklusId}/uji-konsistensi', 'get', cycleRoute, "router.get('/paket/:id/siklus-verval/:siklusId/uji-konsistensi'"],
];

test('OpenAPI YAML parses and declares the implemented Stage 3A/3B operations', () => {
  assert.equal(spec.openapi, '3.1.0');
  assert.deepEqual(spec.servers.map((server) => server.url), ['/api']);
  for (const [path, method, source, routeDeclaration] of declared) {
    assert.ok(spec.paths[path]?.[method], `missing OpenAPI ${method.toUpperCase()} ${path}`);
    assert.ok(source.includes(routeDeclaration), `route is not registered in source: ${method} ${path}`);
    assert.match(spec.paths[path][method].operationId, /^[A-Za-z][A-Za-z0-9]+$/);
    assert.ok(spec.paths[path][method].responses?.['200'] || spec.paths[path][method].responses?.['201']);
  }
  assert.equal(spec.paths['/healthz'].get.security.length, 0);
  assert.match(routeIndex, /router\.use\(healthRouter\)/);
  assert.match(routeIndex, /router\.use\(paketRouter\)/);
  assert.match(packageRoute, /router\.use\(requireAuth\)/);
  assert.match(packageRoute, /router\.use\(surveiRouter\)/);
  assert.match(packageRoute, /router\.use\(siklusVervalRouter\)/);
});

test('all documented authenticated operations inherit Bearer JWT and consistency has no POST', () => {
  assert.deepEqual(spec.security, [{ bearerAuth: [] }]);
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
  for (const [path, method] of declared) {
    assert.notDeepEqual(spec.paths[path][method].security, []);
  }
  assert.equal(spec.paths['/paket/{id}/siklus-verval/{siklusId}/uji-konsistensi'].post, undefined);
  assert.match(spec.paths['/paket/{id}/siklus-verval/{siklusId}/uji-konsistensi'].get.description, /READ sahaja/i);
});

test('request schemas match validator keys and mark both prototype surfaces TEST/QA', () => {
  assert.deepEqual(Object.keys(spec.components.schemas.SurveySessionCreate.properties).sort(), [
    'tim_id', 'ruas_id', 'alat_id', 'operator_id', 'pengemudi_id', 'tanggal', 'jam_mulai', 'jam_selesai',
    'lajur', 'arah', 'cuaca', 'kondisi_permukaan', 'panjang_tercapai_km', 'link_video',
  ].sort());
  assert.deepEqual(spec.components.schemas.SurveySessionCreate.required, ['tim_id', 'ruas_id', 'alat_id', 'tanggal']);
  assert.deepEqual(Object.keys(spec.components.schemas.SurveySegmentCreate.properties).sort(), [
    'jenis_survei_id', 'sta_awal', 'sta_akhir', 'lajur', 'nilai_utama', 'atribut_detail', 'lat', 'lon',
  ].sort());
  assert.match(sessionSchema, /sesiSurveiCreateSchema/);
  assert.match(segmentSchema, /dataSegmenCreateSchema/);
  assert.match(prototypeSchema, /pemeriksaanHarianAlatPrototypeSchema/);
  assert.match(cycleSchema, /siklusVervalCreateBodySchema\s*=\s*z\.object\(\{\}\)\.strict\(\)/);
  assert.match(spec.paths['/paket/{id}/pemeriksaan-harian-alat'].get.summary, /TEST\/QA/);
  assert.match(spec.paths['/paket/{id}/pemeriksaan-harian-alat'].post.description, /TEST\/QA/);
  assert.match(spec.paths['/paket/{id}/siklus-verval'].post.description, /TEST\/QA allowlist/);
  assert.equal(spec.components.schemas.EmptyObject.additionalProperties, false);
  assert.equal(spec.paths['/paket/{id}/siklus-verval'].post.requestBody.required, false);
});

test('OpenAPI documents implemented success and common error status codes', () => {
  for (const [path, method] of declared) {
    const operation = spec.paths[path][method];
    assert.ok(operation.responses['400'], `${method} ${path}: missing 400`);
    assert.ok(operation.responses['401'], `${method} ${path}: missing 401`);
    assert.ok(operation.responses['403'], `${method} ${path}: missing 403`);
    assert.ok(operation.responses['404'], `${method} ${path}: missing 404`);
    assert.ok(operation.responses['502'], `${method} ${path}: missing 502`);
    assert.ok(operation.responses['503'], `${method} ${path}: missing 503`);
  }
  for (const path of ['/paket/{id}/sesi-survei', '/paket/{id}/sesi-survei/{sesiId}/data-segmen', '/paket/{id}/pemeriksaan-harian-alat', '/paket/{id}/siklus-verval']) {
    assert.ok(spec.paths[path].post.responses['201']);
    assert.ok(spec.paths[path].post.requestBody);
  }
});
