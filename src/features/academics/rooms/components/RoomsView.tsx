"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { AlertCircle, DoorOpen, Download, Edit2, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { AccessDenied, Button } from "@/components/ui";
import Select from "@/components/ui/input/Select";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import { useToast } from "@/components/ui/toast/Toast";
import RoomDialog from "./RoomDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  updateRoom,
} from "@/features/academics/rooms/services/roomsService";
import { Room } from "@/features/academics/timetable/types/timetable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";
import AcademicModuleEmptyState from "@/features/academics/components/shared/AcademicModuleEmptyState";

interface RoomsViewProps {
  schoolId: string;
  academicYearId: string;
  termId: string;
  isReadOnly: boolean;
}

type RoomsQueryState = {
  searchQuery: string;
};

type StatusFilter = "all" | "active" | "inactive";

type RoomDraft = Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">;

function roomApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    error.error &&
    typeof error.error === "object" &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export default function RoomsView({
  schoolId,
  academicYearId,
  termId,
  isReadOnly,
}: RoomsViewProps) {
  const t = useTranslations("academics.timetable.rooms");
  const tCommon = useTranslations("common");
  const tEmpty = useTranslations("academics.module_empty_states");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewRooms = hasPermission("academics.structure.view");
  const canManageRooms = hasPermission("academics.structure.manage");
  const canMutateRooms = canManageRooms && !isReadOnly;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(canViewRooms);
  const [loadError, setLoadError] = useState<string | null>(null);
  const queryState = useMemo<RoomsQueryState>(
    () => ({
      searchQuery: searchParams.get("roomSearch") || "",
    }),
    [searchParams],
  );
  const [searchInputValue, setSearchInputValue] = useState(queryState.searchQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRoomSaving, setIsRoomSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setSearchInputValue(queryState.searchQuery));
  }, [queryState.searchQuery]);

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        searchQuery: string;
      }>,
      historyMode: "push" | "replace" = "push",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const searchQuery = nextState.searchQuery ?? queryState.searchQuery;

      if (searchQuery) {
        params.set("roomSearch", searchQuery);
      } else {
        params.delete("roomSearch");
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [queryState.searchQuery, router, searchParams],
  );

  const syncSearchQueryParam = useDebouncedCallback((value: string) => {
    syncQueryParams({ searchQuery: value }, "replace");
  }, 250);

  useEffect(() => () => {
    syncSearchQueryParam.cancel();
  }, [syncSearchQueryParam]);

  const loadRooms = useCallback(async () => {
    if (!canViewRooms) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedRooms = await fetchRooms(schoolId);
      setRooms(loadedRooms);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      const errorMessage = roomApiErrorMessage(error, t("loadError"));
      setLoadError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }, [canViewRooms, schoolId, showToast, t]);

  useEffect(() => {
    if (!canViewRooms) {
      return;
    }
    void Promise.resolve().then(loadRooms);
  }, [canViewRooms, loadRooms]);

  const openAddRoomDialog = () => {
    if (!canMutateRooms) return;

    setEditingRoom(null);
    setRoomDialogOpen(true);
  };

  const openEditRoomDialog = (room: Room) => {
    if (!canMutateRooms) return;

    setEditingRoom(room);
    setRoomDialogOpen(true);
  };

  const openDeleteRoomDialog = (room: Room) => {
    if (!canMutateRooms) return;

    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const saveRoom = async (roomDraft: RoomDraft) => {
    if (!canMutateRooms || isRoomSaving) return;

    setIsRoomSaving(true);
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomDraft);
      } else {
        await createRoom(schoolId, roomDraft);
      }
      showToast(tCommon("save_success"), "success");
      await loadRooms();
      setRoomDialogOpen(false);
    } catch (error) {
      console.error("Failed to save room:", error);
      showToast(roomApiErrorMessage(error, tCommon("save_failed")), "error");
    } finally {
      setIsRoomSaving(false);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete || !canMutateRooms) return;

    try {
      await deleteRoom(roomToDelete.id);
      showToast(tCommon("deleted"), "success");
      await loadRooms();
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Failed to delete room:", error);
      showToast(roomApiErrorMessage(error, tCommon("delete_failed")), "error");
    }
  };

  const buildingOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rooms
            .map((room) => room.building?.trim())
            .filter((building): building is string => Boolean(building)),
        ),
      )
        .sort((left, right) => left.localeCompare(right))
        .map((building) => ({ value: building, label: building })),
    [rooms],
  );

  const floorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rooms
            .map((room) => room.floor?.trim())
            .filter((floor): floor is string => Boolean(floor)),
        ),
      )
        .sort((left, right) => left.localeCompare(right))
        .map((floor) => ({ value: floor, label: floor })),
    [rooms],
  );

  const filteredRooms = useMemo(() => {
    const searchQuery = searchInputValue.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesSearch =
        !searchQuery ||
        [room.name, room.nameAr, room.nameEn, room.building, room.floor].some(
          (roomField) => roomField?.toLowerCase().includes(searchQuery),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && room.isActive) ||
        (statusFilter === "inactive" && !room.isActive);
      const matchesBuilding =
        !buildingFilter || room.building?.trim() === buildingFilter;
      const matchesFloor = !floorFilter || room.floor?.trim() === floorFilter;

      return matchesSearch && matchesStatus && matchesBuilding && matchesFloor;
    });
  }, [buildingFilter, floorFilter, rooms, searchInputValue, statusFilter]);

  const columns = [
    {
      key: "name",
      label: t("table.name"),
      render: (_value: unknown, room: Room) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900">
            {locale === "ar" ? room.nameAr : room.nameEn}
          </div>
          <div className="truncate text-sm text-gray-500">
            {[room.nameAr, room.nameEn].filter(Boolean).join(" / ")}
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      label: t("table.capacity"),
      render: (_value: unknown, room: Room) => (
        <span className="text-gray-900">{room.capacity ? room.capacity : "-"}</span>
      ),
    },
    {
      key: "building",
      label: t("building"),
      render: (_value: unknown, room: Room) => (
        <span className="text-gray-900">{room.building || "-"}</span>
      ),
    },
    {
      key: "floor",
      label: t("floor"),
      render: (_value: unknown, room: Room) => (
        <span className="text-gray-900">{room.floor || "-"}</span>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_value: unknown, room: Room) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            room.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {room.isActive ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_value: unknown, room: Room) =>
        canManageRooms ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditRoomDialog(room)}
              disabled={isReadOnly}
              className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400"
              aria-label={tCommon("edit")}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteRoomDialog(room)}
              disabled={isReadOnly}
              className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400"
              aria-label={tCommon("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  const roomExportRows = useMemo(
    () =>
      filteredRooms.map((room) => ({
        dataset: t("title"),
        name: locale === "ar" ? room.nameAr : room.nameEn,
        secondaryName: locale === "ar" ? room.nameEn : room.nameAr,
        capacity: room.capacity,
        building: room.building || "",
        floor: room.floor || "",
        status: room.isActive ? t("active") : t("inactive"),
      })),
    [filteredRooms, locale, t],
  );

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: termId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columnsForExport: ExportColumn[] = [
      { key: "dataset", label: t("title") },
      { key: "name", label: t("name") },
      { key: "secondaryName", label: t("name") },
      { key: "capacity", label: t("capacity") },
      { key: "building", label: t("building") },
      { key: "floor", label: t("floor") },
      { key: "status", label: t("status") },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename("rooms", termId),
      format,
      columns: columnsForExport,
      rows: roomExportRows,
      locale,
      jsonData: {
        title: "Rooms",
        metadata,
        rooms: filteredRooms,
      },
    });
  };

  if (!canViewRooms) {
    return (
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <AccessDenied />
      </main>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t("title")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              disabled={roomExportRows.length === 0}
            >
              {tExport("button")}
            </Button>
            {canManageRooms && (
              <Button
                onClick={openAddRoomDialog}
                disabled={isReadOnly}
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {t("addRoom")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isReadOnly && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span>{t("readOnlyTerm")}</span>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("search")}
              </label>
              <input
                type="text"
                value={searchInputValue}
                onChange={(event) => {
                  const nextSearchValue = event.target.value;
                  setSearchInputValue(nextSearchValue);
                  syncSearchQueryParam(nextSearchValue);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Select
              label={t("status")}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                { value: "all", label: t("allStatuses") },
                { value: "active", label: t("active") },
                { value: "inactive", label: t("inactive") },
              ]}
            />
            <Select
              label={t("building")}
              value={buildingFilter}
              onChange={setBuildingFilter}
              placeholder={t("allBuildings")}
              options={[
                { value: "", label: t("allBuildings") },
                ...buildingOptions,
              ]}
            />
            <Select
              label={t("floor")}
              value={floorFilter}
              onChange={setFloorFilter}
              placeholder={t("allFloors")}
              options={[{ value: "", label: t("allFloors") }, ...floorOptions]}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <MainLoader />
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-sm text-red-700">{loadError}</p>
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => void loadRooms()}
                >
                  {tCommon("retry")}
                </Button>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <AcademicModuleEmptyState
              icon={DoorOpen}
              title={tEmpty("no_rooms.title")}
              description={tEmpty("no_rooms.description")}
              ctaLabel={canMutateRooms ? tEmpty("no_rooms.cta") : undefined}
              onCtaClick={canMutateRooms ? openAddRoomDialog : undefined}
              className="py-12"
            />
          ) : (
            <DataTable
              data={filteredRooms as unknown as { [key: string]: unknown }[]}
              columns={
                columns as unknown as Array<{
                  key: string;
                  label: string;
                  sortable?: boolean;
                  render?: (value: unknown, row: unknown) => React.ReactNode;
                }>
              }
              emptyTitle={t("emptyTitle")}
              emptyDescription={t("emptyDescription")}
              searchQuery={searchInputValue}
            />
          )}
        </div>
      </div>

      {roomDialogOpen && (
        <RoomDialog
          open={roomDialogOpen}
          room={editingRoom}
          isSaving={isRoomSaving}
          onSave={saveRoom}
          onClose={() => {
            if (!isRoomSaving) {
              setRoomDialogOpen(false);
            }
          }}
        />
      )}

      {deleteDialogOpen && roomToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title={t("deleteRoom")}
          description={t("deleteConfirm")}
          confirmLabel={tCommon("delete")}
          cancelLabel={tCommon("cancel")}
          onConfirm={confirmDeleteRoom}
          onClose={() => {
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
          }}
          severity="danger"
        />
      )}

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={roomExportRows.length}
      />
    </div>
  );
}
