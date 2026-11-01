import { expect, it } from "bun:test";
import { fromLocalPublicationInput, toLocalPublicationInput } from "@/lib/publication-time";

it("round trips a local minute to an absolute instant", () => {
  const local = "2099-01-01T19:30";
  const instant = fromLocalPublicationInput(local);
  expect(instant).not.toBeNull();
  expect(toLocalPublicationInput(instant!)).toBe(local);
  expect(Date.parse(instant!)).toBe(new Date(2099, 0, 1, 19, 30).getTime());
});
it("rejects invalid dates and offset-bearing values in a datetime-local field", () => {
  for (const value of ["", "invalid", "2099-02-30T12:00", "2099-01-01T24:00", "2099-01-01T19:30Z", "2099-01-01T19:30+07:00"])
    expect(fromLocalPublicationInput(value)).toBeNull();
});
