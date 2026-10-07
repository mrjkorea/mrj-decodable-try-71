"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mergeBookProgress,
  mergeDecodableBooks,
  parseProgressJson,
  needsSaveAfterMerge,
} = require("../decodable-progress.js");

test("mergeBookProgress ORs section flags and maxes scores", () => {
  const local = {
    listen: true,
    read: false,
    dictScore: 70,
    readPages: { "0": true },
    speakPages: { "0": 80 },
  };
  const remote = {
    read: true,
    song: true,
    dictScore: 90,
    readPages: { "1": true },
    speakPages: { "0": 60, "1": 95 },
    rev: 2,
  };
  const m = mergeBookProgress(local, remote);
  assert.equal(m.listen, true);
  assert.equal(m.read, true);
  assert.equal(m.song, true);
  assert.equal(m.dictScore, 90);
  assert.equal(m.readPages["0"], true);
  assert.equal(m.readPages["1"], true);
  assert.equal(m.speakPages["0"], 80);
  assert.equal(m.speakPages["1"], 95);
  assert.equal(m.rev, 2);
});

test("mergeDecodableBooks unions per-book progress", () => {
  const merged = mergeDecodableBooks(
    { a: { listen: true }, b: { read: true } },
    { a: { read: true }, c: { song: true } }
  );
  assert.equal(merged.a.listen, true);
  assert.equal(merged.a.read, true);
  assert.equal(merged.b.read, true);
  assert.equal(merged.c.song, true);
});

test("unparseable server JSON keeps local via empty server books", () => {
  const parsed = parseProgressJson("{not json");
  assert.equal(parsed.parseOk, false);
  assert.deepEqual(parsed.books, {});
  const local = { x: { listen: true } };
  const merged = mergeDecodableBooks(local, parsed.books);
  assert.equal(merged.x.listen, true);
  assert.equal(needsSaveAfterMerge(merged, parsed.books), true);
});

test("needsSaveAfterMerge false when only server data was merged in", () => {
  const books = { mlr_dec_071: { listen: true, readPages: { "0": true } } };
  const merged = mergeDecodableBooks({}, books);
  assert.equal(needsSaveAfterMerge(merged, books), false);
});

test("needsSaveAfterMerge true when local adds progress beyond server", () => {
  const server = { mlr_dec_071: { listen: true } };
  const local = { mlr_dec_071: { read: true } };
  const merged = mergeDecodableBooks(local, server);
  assert.equal(needsSaveAfterMerge(merged, server), true);
});
