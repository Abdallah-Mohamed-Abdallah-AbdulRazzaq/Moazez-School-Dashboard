import Image from "next/image";
import { Video } from "lucide-react";
import type { AcademicOnlineSessionPlatform } from "../../types/contracts";

const PLATFORM_ICON_PATHS: Record<
  Exclude<AcademicOnlineSessionPlatform, "OTHER">,
  string
> = {
  GOOGLE_MEET: "/assets/academic-content/meeting-platforms/google-meet.png",
  ZOOM: "/assets/academic-content/meeting-platforms/zoom.png",
  MICROSOFT_TEAMS:
    "/assets/academic-content/meeting-platforms/microsoft-teams.png",
  WEBEX: "/assets/academic-content/meeting-platforms/webex.png",
};

interface MeetingPlatformIconProps {
  platform: AcademicOnlineSessionPlatform;
}

export default function MeetingPlatformIcon({
  platform,
}: MeetingPlatformIconProps) {
  if (platform === "OTHER") {
    return (
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600"
      >
        <Video className="size-4" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center"
    >
      <Image
        src={PLATFORM_ICON_PATHS[platform]}
        alt=""
        width={24}
        height={24}
        className="size-6 object-contain"
      />
    </span>
  );
}
