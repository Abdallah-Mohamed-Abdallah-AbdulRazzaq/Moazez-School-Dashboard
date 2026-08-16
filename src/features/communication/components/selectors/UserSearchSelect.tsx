"use client";

import PaginatedUserSelect, {
  type PaginatedUserSelectProps,
} from "@/features/settings/users/components/PaginatedUserSelect";

export type UserSearchSelectProps = PaginatedUserSelectProps;

export default function UserSearchSelect(props: UserSearchSelectProps) {
  return <PaginatedUserSelect {...props} />;
}
