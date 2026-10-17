import { deleteEntry } from "./timetableApiAdapter";

const DELETION_BATCH_SIZE = 4;

export async function deleteTimetableEntries(
  entryIds: string[],
  onDeleted: (completed: number) => void,
) {
  let completed = 0;
  for (
    let offset = 0;
    offset < entryIds.length;
    offset += DELETION_BATCH_SIZE
  ) {
    const outcomes = await Promise.allSettled(
      entryIds.slice(offset, offset + DELETION_BATCH_SIZE).map(deleteEntry),
    );
    completed += outcomes.filter(
      (outcome) => outcome.status === "fulfilled",
    ).length;
    onDeleted(completed);
    // Recovery must not race requests that are still changing the timetable.
    const failure = outcomes.find((outcome) => outcome.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }
}
