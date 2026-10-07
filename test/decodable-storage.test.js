"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  LEGACY_DEVICE_SAVE_KEY,
  studentSaveKey,
  readStudentStore,
  progressBlobFromStorage,
} = require("../decodable-progress.js");

test("readStudentStore never touches the shared legacy device key", () => {
  const keysRead = [];
  const legacyPayload = JSON.stringify({
    byStudent: {
      alice: { mlr_dec_071: { listen: true } },
      bob: { mlr_dec_072: { read: true } },
    },
  });
  const storage = { [LEGACY_DEVICE_SAVE_KEY]: legacyPayload };

  function getItem(key) {
    keysRead.push(key);
    return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
  }

  const store = readStudentStore(getItem, "alice");
  assert.deepEqual(store, {});
  assert.ok(!keysRead.includes(LEGACY_DEVICE_SAVE_KEY));
  assert.deepEqual(keysRead, [studentSaveKey("alice")]);
});

test("save payload uses only per-student key data, not legacy mixed storage", () => {
  const legacyPayload = JSON.stringify({
    byStudent: {
      alice: { mlr_dec_071: { listen: true } },
      bob: { mlr_dec_072: { read: true } },
    },
  });
  const studentPayload = JSON.stringify({
    byStudent: {
      alice: { mlr_dec_071: { song: true } },
    },
  });
  const storage = { [LEGACY_DEVICE_SAVE_KEY]: legacyPayload };

  function getItem(key) {
    return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
  }

  const blobOnlyLegacy = progressBlobFromStorage(getItem, "alice", "alice");
  assert.deepEqual(JSON.parse(blobOnlyLegacy).books, {});

  storage[studentSaveKey("alice")] = studentPayload;
  const blob = progressBlobFromStorage(getItem, "alice", "alice");
  assert.equal(blob.includes('"listen":true'), false);
  assert.equal(blob.includes('"song":true'), true);
});
