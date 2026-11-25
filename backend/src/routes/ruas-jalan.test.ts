import test from 'node:test';
import assert from 'node:assert/strict';
import { packageRoadAssignmentEnabled } from './ruas-jalan';

test('package-road assignment remains disabled until enabled, approved and authorization-installed flags are all explicit', () => {
  assert.equal(packageRoadAssignmentEnabled({ enabled: 'true', approved: 'true', installed: 'true' }), true);
  assert.equal(packageRoadAssignmentEnabled({ enabled: 'true', approved: 'true', installed: 'false' }), false);
  assert.equal(packageRoadAssignmentEnabled({ enabled: 'true', approved: 'false', installed: 'true' }), false);
  assert.equal(packageRoadAssignmentEnabled({ enabled: 'false', approved: 'true', installed: 'true' }), false);
  assert.equal(packageRoadAssignmentEnabled({ enabled: undefined, approved: undefined, installed: undefined }), false);
});
