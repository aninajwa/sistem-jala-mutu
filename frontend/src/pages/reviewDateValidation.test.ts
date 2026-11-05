import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidReviewDate } from './reviewDateValidation';
test('rejects invalid review dates and accepts leap days',()=>{
 assert.equal(isValidReviewDate('2027-02-29'),false);
 assert.equal(isValidReviewDate('2028-02-29'),true);
 assert.equal(isValidReviewDate('2027-04-31'),false);
 assert.equal(isValidReviewDate('2027-13-01'),false);
 assert.equal(isValidReviewDate('2027-06-01'),true);
 assert.equal(isValidReviewDate('2027-6-1'),false);
});
