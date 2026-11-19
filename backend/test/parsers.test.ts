import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTelemetry } from "../src/consumers/vehicle_telemetry.consumer.js";
import { parseId, parseVehicleInput } from "../src/controllers/vehicle.controller.js";
import { parsePage } from "../src/controllers/vehicle_telemetry.controller.js";
import { BadRequestError, ValidationFailedError } from "../src/utils/errors.js";

const ping = { vehicle_id: 1, ts: "2026-11-19T06:00:00Z", lat: -33.87, lon: 151.21, speed: 62.5 };

function message(value: unknown): Buffer {
  return Buffer.from(JSON.stringify(value));
}

test("parseTelemetry returns a valid ping with ts in UTC", () => {
  assert.deepEqual(parseTelemetry(message({ ...ping, ts: "2026-11-19T17:00:00+11:00" })), {
    ...ping,
    ts: "2026-11-19T06:00:00.000Z",
  });
});

test("parseTelemetry rejects bad messages", () => {
  const bad = [
    { ...ping, vehicle_id: 0 },
    { ...ping, vehicle_id: 2_147_483_648 },
    { ...ping, vehicle_id: "1" },
    { ...ping, ts: "1" },
    { ...ping, ts: "2026-11-19T06:00:00" },
    { ...ping, ts: "2026-02-30T00:00:00Z" },
    { ...ping, ts: "2026-13-01T00:00:00Z" },
    { ...ping, lat: 91 },
    { ...ping, lon: -181 },
    { ...ping, speed: -1 },
    { ...ping, speed: undefined },
  ];
  for (const value of bad) {
    assert.equal(parseTelemetry(message(value)), null, JSON.stringify(value));
  }
  assert.equal(parseTelemetry(Buffer.from("not json")), null);
  assert.equal(parseTelemetry(null), null);
});

test("parseVehicleInput trims and upper-cases the registration", () => {
  assert.deepEqual(parseVehicleInput({ registration: " abc-123 ", name: " Hino 500 " }), {
    registration: "ABC-123",
    name: "Hino 500",
  });
});

test("parseVehicleInput reports every field error", () => {
  assert.throws(
    () => parseVehicleInput({ registration: "x".repeat(21) }),
    (err) =>
      err instanceof ValidationFailedError &&
      err.errors.registration[0] === "registration must be at most 20 characters" &&
      err.errors.name[0] === "name is required",
  );
  assert.throws(() => parseVehicleInput(undefined), ValidationFailedError);
});

test("parseId accepts positive integers only", () => {
  assert.equal(parseId("42"), 42);
  for (const value of ["0", "-1", "abc", "3000000000"]) {
    assert.throws(() => parseId(value), value);
  }
});

test("parsePage defaults and checks limit and offset", () => {
  assert.deepEqual(parsePage(undefined, undefined), { limit: 100, offset: 0 });
  assert.deepEqual(parsePage("20", "40"), { limit: 20, offset: 40 });
  const bad = [
    ["0", "0"],
    ["1001", "0"],
    ["1.5", "0"],
    ["abc", "0"],
    ["10", "-1"],
    ["10", "abc"],
    [["10", "20"], "0"],
  ];
  for (const [limit, offset] of bad) {
    assert.throws(() => parsePage(limit, offset), BadRequestError, JSON.stringify([limit, offset]));
  }
});
