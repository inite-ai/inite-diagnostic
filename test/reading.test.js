import assert from "node:assert/strict";
import { test } from "node:test";
import { quantity, countChannels, readAnswers, formatReading } from "../dist/reading.js";
import { SLOT_KEYS } from "../dist/slots.js";

test("a range becomes its midpoint and says so", () => {
  const q = quantity("50-100 a day");
  assert.equal(q.value, 75);
  assert.match(q.note, /read 50-100 as 75/);
});

test("an en dash is a range too — the options say 10–50 and people paste them", () => {
  assert.equal(quantity("10–50").value, 30);
});

test("a single number is taken as given, with nothing to disclose", () => {
  const q = quantity("about 80");
  assert.equal(q.value, 80);
  assert.equal(q.note, undefined);
});

test("an answer with no digits is not a quantity, and is not guessed at", () => {
  assert.equal(quantity("hard to say"), null);
  assert.equal(quantity("__skip__"), null);
  assert.equal(quantity(""), null);
});

test("thousands separators do not become two numbers", () => {
  // "1,200 a day" split on the comma would read as the range 1-200.
  assert.equal(quantity("1 200 a day").value, 1200);
});

test("channels are counted across commas, slashes and the word for and", () => {
  assert.equal(countChannels("WhatsApp, email / phone"), 3);
  assert.equal(countChannels("почта и телефон"), 2, "Cyrillic: \\b cannot match a Russian и");
  assert.equal(countChannels("email"), 1);
  assert.equal(countChannels("__skip__"), null);
});

test("the arithmetic divides what it was given and shows the assumption", () => {
  const { lines } = readAnswers({ dailyInquiries: "50-100", teamSize: "2" });
  assert.match(lines[0], /75 enquiries a day across 2 people — 38 each/);
  assert.match(lines[0], /read 50-100 as 75/);
});

test("without a headcount it says the load per person is unknown rather than assuming one", () => {
  const { lines } = readAnswers({ dailyInquiries: "80" });
  assert.match(lines[0], /not answered/);
  assert.doesNotMatch(lines[0], /each/);
});

test("a conversion that cannot be true is said out loud rather than printed", () => {
  const { lines } = readAnswers({ dailyInquiries: "10", dailyLeads: "40" });
  assert.ok(
    lines.some((l) => /do not sit together/.test(l)),
    "400% conversion is an answer to the wrong question, not a finding"
  );
});

test("blanks and declines are named separately, because they are not the same", () => {
  const { blank, declined } = readAnswers({ industry: "Consulting", goal: "__skip__" });
  assert.deepEqual(declined, ["goal"]);
  assert.ok(!blank.includes("industry"));
  assert.ok(!blank.includes("goal"), "a declined slot has been asked");
  assert.equal(blank.length, SLOT_KEYS.length - 2);
});

test("the offer to sign in appears once, and only to somebody who has not", () => {
  const out = formatReading({ dailyInquiries: "80", teamSize: "2" }, false);
  assert.match(out, /npx @inite\/diagnostic login/);
  const signedIn = formatReading({ dailyInquiries: "80", teamSize: "2" }, true);
  assert.doesNotMatch(signedIn, /login/, "telling somebody to sign in after they have is noise");
});

test("the reading says what it is not, whoever is reading it", () => {
  for (const signedIn of [true, false]) {
    assert.match(
      formatReading({ dailyInquiries: "80" }, signedIn),
      /cannot do is say what to automate first/,
      "arithmetic passed off as an audit is the whole failure this package could have"
    );
  }
});
