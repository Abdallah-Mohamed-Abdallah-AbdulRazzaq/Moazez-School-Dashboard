import { describe, expect, it } from "vitest";
import {
  placeToLocationValue,
  validateCoordinateDraft,
} from "../locationModel";

describe("validateCoordinateDraft", () => {
  it.each([
    [{ latitude: "24.7", longitude: "" }, "coordinate_pair_required"],
    [{ latitude: "latitude", longitude: "46" }, "latitude_invalid"],
    [{ latitude: "91", longitude: "46" }, "latitude_out_of_range"],
    [{ latitude: "24", longitude: "longitude" }, "longitude_invalid"],
    [{ latitude: "24", longitude: "181" }, "longitude_out_of_range"],
  ])("rejects invalid coordinate pair %j", (draft, reason) => {
    expect(validateCoordinateDraft(draft)).toEqual({ valid: false, reason });
  });

  it.each([
    [{ latitude: "", longitude: "" }, null],
    [
      { latitude: "24.7136", longitude: "46.6753" },
      { latitude: 24.7136, longitude: 46.6753 },
    ],
  ])("accepts coordinate pair %j", (draft, value) => {
    expect(validateCoordinateDraft(draft)).toEqual({ valid: true, value });
  });
});

describe("placeToLocationValue", () => {
  it("normalizes a Google place to six-decimal coordinates", () => {
    expect(
      placeToLocationValue({
        name: "School",
        formatted_address: "Riyadh, Saudi Arabia",
        geometry: {
          location: {
            lat: () => 24.71361234,
            lng: () => 46.67531234,
          },
        },
      }),
    ).toEqual({
      latitude: 24.713612,
      longitude: 46.675312,
      label: "School",
      formattedAddress: "Riyadh, Saudi Arabia",
    });
  });

  it("returns null when a place has no coordinates", () => {
    expect(placeToLocationValue({ name: "School" })).toBeNull();
  });
});
