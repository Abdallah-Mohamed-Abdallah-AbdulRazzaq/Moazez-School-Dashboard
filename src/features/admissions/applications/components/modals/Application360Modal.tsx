// FILE: src/components/admissions/Application360Modal.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Heart,
  FileCheck,
} from "lucide-react";
import { Application } from "@/features/admissions/types/admissions";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import TabNavigation from "@/features/admissions/shared/TabNavigation";

interface Application360ModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onScheduleTest: () => void;
  onScheduleInterview: () => void;
  onMakeDecision: () => void;
  onEnroll: () => void;
}

export default function Application360Modal({
  application,
  isOpen,
  onClose,
  onScheduleTest,
  onScheduleInterview,
  onMakeDecision,
  onEnroll,
}: Application360ModalProps) {
  const t = useTranslations("admissions.application360");
  const notAvailable = t("overview.not_available");
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen) return null;

  const tabs = [
    {
      id: "details",
      label: t("tabs.details"),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "documents",
      label: t("tabs.documents"),
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: "tests",
      label: t("tabs.tests"),
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: "interviews",
      label: t("tabs.interviews"),
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("header.title")} {application.id}
            </h2>
            <p className="text-sm text-gray-500">
              {application.studentName} - {application.gradeRequested}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t("details.student_info")}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.english_name")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.full_name_en || application.studentName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.arabic_name")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.full_name_ar ||
                          application.studentNameArabic ||
                          notAvailable}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("details.gender")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.gender || notAvailable}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("details.date_of_birth")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.date_of_birth
                            ? new Date(
                                application.date_of_birth,
                              ).toLocaleDateString()
                            : notAvailable}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.nationality")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.nationality || notAvailable}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.stage")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.stage ||
                          (() => {
                            const grade =
                              application.grade_requested ||
                              application.gradeRequested;
                            const gradeNum = parseInt(
                              grade?.replace(/\D/g, "") || "0",
                            );
                            if (gradeNum >= 1 && gradeNum <= 5)
                              return "Primary";
                            if (gradeNum >= 6 && gradeNum <= 9)
                              return "Preparatory";
                            if (gradeNum >= 10 && gradeNum <= 12)
                              return "Secondary";
                            return notAvailable;
                          })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.grade_requested")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.grade_requested ||
                          application.gradeRequested}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t("details.contact_info")}
                  </h3>
                  <div className="space-y-3">
                    {application.address_line && (
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("details.address")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.address_line}
                        </p>
                        {(application.district || application.city) && (
                          <p className="text-xs text-gray-600">
                            {[application.district, application.city]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t("details.academic_info")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {application.previous_school && (
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.previous_school")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {application.previous_school}
                      </p>
                    </div>
                  )}
                  {application.join_date && (
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.intended_join_date")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(application.join_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("details.application_status")}
                    </p>
                    <StatusBadge status={application.status} size="md" />
                  </div>
                </div>
              </div>

              {/* Medical & Notes */}
              {(application.medical_conditions || application.notes) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    {t("details.medical_additional")}
                  </h3>
                  <div className="space-y-3">
                    {application.medical_conditions && (
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("details.medical_conditions")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.medical_conditions}
                        </p>
                      </div>
                    )}
                    {application.notes && (
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("details.notes")}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("details.important_dates")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("details.submitted_date")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(application.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {application.join_date && (
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("details.expected_start_date")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(application.join_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "guardians" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                {t("guardians.title")}
              </h3>
              {application.guardians && application.guardians.length > 0 ? (
                <div className="space-y-4">
                  {application.guardians.map((guardian, index) => (
                    <div
                      key={guardian.id || index}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {guardian.full_name}
                            {guardian.is_primary && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                {t("guardians.primary")}
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {guardian.relation}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />{" "}
                              {t("guardians.primary_phone")}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.phone_primary}
                            </p>
                          </div>
                          {guardian.phone_secondary && (
                            <div>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{" "}
                                {t("guardians.secondary_phone")}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {guardian.phone_secondary}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />{" "}
                              {t("guardians.email")}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              {t("guardians.national_id")}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.national_id}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />{" "}
                              {t("guardians.job_title")}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.job_title}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              {t("guardians.workplace")}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {guardian.workplace}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              {t("guardians.permissions")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {guardian.can_pickup && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {t("guardians.can_pickup")}
                                </span>
                              )}
                              {guardian.can_receive_notifications && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {t("guardians.receives_notifications")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>{t("guardians.primary_guardian")}:</strong>{" "}
                    {application.guardianName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>{t("guardians.phone")}:</strong>{" "}
                    {application.guardianPhone}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>{t("guardians.email")}:</strong>{" "}
                    {application.guardianEmail}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                {t("documents.title")}
              </h3>
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.type}
                        </p>
                        {doc.name && (
                          <p className="text-xs text-gray-500">{doc.name}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {t("tests.title")}
                </h3>
                <button
                  onClick={onScheduleTest}
                  className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("tests.schedule_test")}
                </button>
              </div>
              {application.tests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t("tests.no_tests")}
                </p>
              ) : (
                <div className="space-y-2">
                  {application.tests.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {test.subject} - {test.type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {test.date} {t("tests.at")} {test.time} •{" "}
                            {test.location}
                          </p>
                          {test.score !== undefined && (
                            <p className="text-sm font-medium text-primary mt-2">
                              {t("tests.score")}: {test.score}/{test.maxScore}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={test.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {t("interviews.title")}
                </h3>
                <button
                  onClick={onScheduleInterview}
                  className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("interviews.schedule_interview")}
                </button>
              </div>
              {application.interviews.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t("interviews.no_interviews")}
                </p>
              ) : (
                <div className="space-y-2">
                  {application.interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {t("interviews.interview_with")}{" "}
                            {interview.interviewer}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {interview.date} {t("interviews.at")}{" "}
                            {interview.time} • {interview.location}
                          </p>
                          {interview.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {interview.notes}
                            </p>
                          )}
                          {interview.rating && (
                            <p className="text-sm font-medium text-primary mt-2">
                              {t("interviews.rating")}: {interview.rating}/5
                            </p>
                          )}
                        </div>
                        <StatusBadge status={interview.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sticky Action Bar */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onScheduleTest}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.schedule_test")}
            </button>
            <button
              onClick={onScheduleInterview}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.schedule_interview")}
            </button>
            <button
              onClick={onMakeDecision}
              className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("actions.make_decision")}
            </button>
            {application.status === "accepted" && (
              <button
                onClick={onEnroll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t("actions.enroll_student")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
