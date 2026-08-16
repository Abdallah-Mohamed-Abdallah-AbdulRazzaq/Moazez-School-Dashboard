import { redirect } from "next/navigation";

export default function AttendancePage() {
  // Redirect to policies sub-tab by default
  redirect("./attendance/policies");
}
