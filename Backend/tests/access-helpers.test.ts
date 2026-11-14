import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuthLink, buildVerificationEmail, escapeHtml } from '../src/back-end-helpers/auth-email.helpers.js';
import { toAuthUser } from '../src/back-end-helpers/auth-user.helpers.js';
import { canSubmitForReview, getNextModerationStatus, shouldFlagForReview } from '../src/back-end-helpers/community-moderation.helpers.js';
import { getNewShoppingItems } from '../src/back-end-helpers/shopping-list.helpers.js';

test('moderators can only move recipes along the allowed lifecycle', () => {
  assert.equal(getNextModerationStatus('approve', 'pending_review'), 'published');
  assert.equal(getNextModerationStatus('approve', 'private'), null);
  assert.equal(getNextModerationStatus('reject', 'needs_review'), 'rejected');
  assert.equal(getNextModerationStatus('unpublish', 'published'), 'unpublished');
  assert.equal(getNextModerationStatus('restore', 'unpublished'), 'published');
  assert.equal(getNextModerationStatus('restore', 'rejected'), null);
});

test('owners can submit drafts and resubmit rejected or unpublished recipes', () => {
  assert.equal(canSubmitForReview('private'), true);
  assert.equal(canSubmitForReview('rejected'), true);
  assert.equal(canSubmitForReview('unpublished'), true);
  assert.equal(canSubmitForReview('pending_review'), false);
  assert.equal(canSubmitForReview('published'), false);
});

test('feedback flags a recipe only after the thresholds are met', () => {
  assert.equal(shouldFlagForReview(2, 0, 0), false);
  assert.equal(shouldFlagForReview(3, 10, 0), true);
  assert.equal(shouldFlagForReview(0, 2, 5), true);
  assert.equal(shouldFlagForReview(0, 6, 5), false);
  assert.equal(shouldFlagForReview(0, 0, 4), false);
});

test('shopping list additions skip names already listed, ignoring case', () => {
  const newItems = getNewShoppingItems(['Garlic'], [
    { name: 'garlic', quantity: '1' },
    { name: 'Onion', quantity: '1' },
    { name: ' onion ', quantity: '2' },
  ]);

  assert.deepEqual(newItems.map((item) => item.name), ['Onion']);
});

test('account emails escape user names and carry the token in the link', () => {
  const link = buildAuthLink('http://localhost:5173', '/Verify-Email', 'abc_123');

  assert.equal(link, 'http://localhost:5173/Verify-Email?token=abc_123');
  assert.equal(escapeHtml('<b>"Juan" & co</b>'), '&lt;b&gt;&quot;Juan&quot; &amp; co&lt;/b&gt;');

  const email = buildVerificationEmail('juan@example.com', '<script>alert(1)</script>', link);
  assert.ok(!email.html.includes('<script>'));
  assert.ok(email.text.includes(link));
});

test('toAuthUser exposes verification status without the password hash', () => {
  const user = toAuthUser({ id: '1', email: 'a@b.c', name: 'A', role: 'user', email_verified_at: null });

  assert.deepEqual(user, { id: '1', email: 'a@b.c', name: 'A', role: 'user', emailVerified: false });
  assert.equal(toAuthUser({ id: '1', email: 'a@b.c', name: 'A', role: 'admin', email_verified_at: new Date() }).emailVerified, true);
});
