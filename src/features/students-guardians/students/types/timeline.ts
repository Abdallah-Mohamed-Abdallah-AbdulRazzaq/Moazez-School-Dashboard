// FILE: src/types/students/timeline.ts
// Student timeline event model

import type { TimelineEventType } from "./enums";

/**
 * Student Timeline Event
 * Represents a significant event in a student's history
 */
export interface StudentTimelineEvent {
  id: string; // Event ID: "EVT-" + application.id + "-" + counter
  studentId: string; // Student this event belongs to
  type: TimelineEventType; // Type of event
  date: string; // When the event occurred (ISO date string)
  title: string; // Human-readable event title
  label?: string;
  description?: string;
  meta?: Record<string, unknown>; // Additional event metadata
}

// Backward compatibility alias
