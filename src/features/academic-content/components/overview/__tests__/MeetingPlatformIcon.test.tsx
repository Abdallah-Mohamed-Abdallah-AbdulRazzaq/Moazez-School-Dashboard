import { render } from "@testing-library/react";
import MeetingPlatformIcon from "../MeetingPlatformIcon";

describe("MeetingPlatformIcon", () => {
  it.each([
    ["GOOGLE_MEET", "google-meet.png"],
    ["ZOOM", "zoom.png"],
    ["MICROSOFT_TEAMS", "microsoft-teams.png"],
    ["WEBEX", "webex.png"],
  ] as const)("shows the %s brand icon", (platform, filename) => {
    const { container } = render(<MeetingPlatformIcon platform={platform} />);

    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      encodeURIComponent(
        `/assets/academic-content/meeting-platforms/${filename}`,
      ),
    );
  });
});
