"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  wireDecodableAuth,
  dispatchDecodableAuthReady,
  afterDecodableLibLoaded,
  scoreItemId,
  DECODABLE_71_SCORE_ITEM_RE,
} = require("../decodable-progress.js");

test("scoreItemId prefixes book id for My scores panel filter", () => {
  assert.equal(scoreItemId("mlr_dec_071", "listen"), "mlr_dec_071:listen");
  assert.equal(scoreItemId("mlr_dec_100", "passed"), "mlr_dec_100:passed");
  assert.ok(DECODABLE_71_SCORE_ITEM_RE.test("mlr_dec_085:dictation"));
  assert.ok(DECODABLE_71_SCORE_ITEM_RE.test("mlr_dec_100:speak"));
  assert.equal(DECODABLE_71_SCORE_ITEM_RE.test("listen"), false);
  assert.equal(DECODABLE_71_SCORE_ITEM_RE.test("mlr_dec_041:listen"), false);
});

test("wireDecodableAuth replays mrj-auth-ready that fired before the app wired", () => {
  let packLoads = 0;
  dispatchDecodableAuthReady({ detail: { id: "zz_test_mrjmetrics" } });

  wireDecodableAuth({
    onAuthReady(ev) {
      assert.equal(ev.detail.id, "zz_test_mrjmetrics");
      packLoads += 1;
    },
  });
  assert.equal(packLoads, 1);
});

test("reload with saved session renders library when lib loads", () => {
  let showLibCalls = 0;
  let packLoads = 0;

  const boot = afterDecodableLibLoaded({
    getStudent: () => "zz_test_mrjmetrics",
    showLib: () => {
      showLibCalls += 1;
    },
    runPackLoad: () => {
      packLoads += 1;
    },
  });

  assert.equal(boot.showedLib, true);
  assert.equal(showLibCalls, 1);
  assert.equal(packLoads, 1);
});

test("afterDecodableLibLoaded skips library when no student", () => {
  const boot = afterDecodableLibLoaded({
    getStudent: () => "",
    showLib: () => {
      throw new Error("should not show");
    },
    runPackLoad: () => {
      throw new Error("should not load");
    },
  });
  assert.equal(boot.showedLib, false);
  assert.equal(boot.startedPackLoad, false);
});
