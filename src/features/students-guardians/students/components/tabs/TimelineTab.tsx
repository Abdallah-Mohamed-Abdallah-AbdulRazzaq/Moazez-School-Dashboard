// FILE: src/components/students-guardians/profile-tabs/TimelineTab.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import type {
  Student,
  StudentTimelineEvent,
} from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";

interface TimelineTabProps {
  student: Student;
}

export default function TimelineTab({ student }: TimelineTabProps) {
  const t = useTranslations("students_guardians.profile.timeline");
  const [events, setEvents] = useState<StudentTimelineEvent[]>([]);
  const [typeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await studentsService.fetchStudentTimeline(student.id);
        if (!isCancelled) setEvents(data);
      } catch (loadError) {
        if (!isCancelled) {
          setEvents([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load timeline.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [student.id]);

  const filteredEvents = events.filter((event) => {
    if (typeFilter === "all") return true;
    return event.type === typeFilter;
  });

  const getColorClasses = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      application_submitted: { bg: "bg-blue-100", text: "text-blue-700" },
      document_uploaded: { bg: "bg-green-100", text: "text-green-700" },
      test_scheduled: { bg: "bg-purple-100", text: "text-purple-700" },
      test_completed: { bg: "bg-purple-100", text: "text-purple-700" },
      interview_scheduled: { bg: "bg-orange-100", text: "text-orange-700" },
      interview_completed: { bg: "bg-orange-100", text: "text-orange-700" },
      decision_made: { bg: "bg-red-100", text: "text-red-700" },
      grade: { bg: "bg-blue-100", text: "text-blue-700" },
      reinforcement: { bg: "bg-green-100", text: "text-green-700" },
      absence: { bg: "bg-red-100", text: "text-red-700" },
      late: { bg: "bg-yellow-100", text: "text-yellow-700" },
      note: { bg: "bg-purple-100", text: "text-purple-700" },
      incident: { bg: "bg-orange-100", text: "text-orange-700" },
    };

    return colors[type] || { bg: "bg-gray-100", text: "text-gray-700" };
  };

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      application_submitted: <GraduationCap className="w-6 h-6" />,
      document_uploaded: <GraduationCap className="w-6 h-6" />,
      test_scheduled: <GraduationCap className="w-6 h-6" />,
      test_completed: <GraduationCap className="w-6 h-6" />,
      interview_scheduled: <MessageSquare className="w-6 h-6" />,
      interview_completed: <MessageSquare className="w-6 h-6" />,
      decision_made: <Award className="w-6 h-6" />,
      grade: <GraduationCap className="w-6 h-6" />,
      reinforcement: <Award className="w-6 h-6" />,
      absence: <Calendar className="w-6 h-6" />,
      late: <Clock className="w-6 h-6" />,
      note: <MessageSquare className="w-6 h-6" />,
      incident: <AlertTriangle className="w-6 h-6" />,
    };

    return icons[type] || <Calendar className="w-6 h-6" />;
  };

  if (isLoading) {
    return <StudentTabSkeleton variant="timeline" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {filteredEvents.length === 0 ? (
          <EmptyState message={t("no_match")} />
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event) => {
                const colors = getColorClasses(event.type);
                const icon = getIcon(event.type);

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white ${colors.bg} shrink-0`}
                    >
                      <div className={colors.text}>{icon}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {event.label || event.title}
                          </h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                        {event.description ? (
                          <p className="text-sm text-gray-600">
                            {event.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
