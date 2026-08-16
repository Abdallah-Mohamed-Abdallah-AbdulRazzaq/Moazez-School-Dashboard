import { apiWithToken } from "@/lib/api";
import type { StructureAdapter } from "@/features/academics/academic-structure-tree/services/structureAdapter";
import type {
  AcademicYear,
  Classroom,
  Grade,
  Section,
  Stage,
  StructureTree,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}
interface ApiListPayload<T> {
  items?: T[];
}

interface AcademicYearApiDto {
  id: string;
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

interface TermApiDto {
  id: string;
  academicYearId?: string;
  yearId?: string;
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  status?: "open" | "closed";
}

interface StageApiDto {
  id: string;
  nameAr: string;
  nameEn: string;
  sortOrder?: number;
  description?: string;
  notes?: string;
  grades?: GradeApiDto[];
}

interface GradeApiDto {
  id: string;
  stageId: string;
  nameAr: string;
  nameEn: string;
  sortOrder?: number;
  capacity?: number;
  notes?: string;
  sections?: SectionApiDto[];
}

interface SectionApiDto {
  id: string;
  gradeId: string;
  nameAr: string;
  nameEn: string;
  sortOrder?: number;
  capacity?: number;
  notes?: string;
  classrooms?: ClassroomApiDto[];
}

interface ClassroomApiDto {
  id: string;
  sectionId: string;
  nameAr: string;
  nameEn: string;
  sortOrder?: number;
  capacity?: number;
  notes?: string;
}

interface AcademicStructureTreeApiDto {
  stages: StageApiDto[];
  grades: GradeApiDto[];
  sections: SectionApiDto[];
  classrooms: ClassroomApiDto[];
}

const unwrap = async <T>(request: Promise<ApiEnvelope<T> | T>): Promise<T> => {
  const response = await request;

  if (
    response &&
    typeof response === "object" &&
    ("data" in response || "error" in response || "message" in response)
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (typeof envelope.data === "undefined") {
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};

const ensureList = <T>(value: T[] | ApiListPayload<T>): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && Array.isArray(value.items)) {
    return value.items;
  }
  return [];
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });
  const value = search.toString();
  return value ? `?${value}` : "";
};

const mapAcademicYear = (dto: AcademicYearApiDto): AcademicYear => ({
  id: dto.id,
  name: dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  startDate: dto.startDate,
  endDate: dto.endDate,
  isActive: dto.isActive,
});

const mapTerm = (dto: TermApiDto): Term => ({
  id: dto.id,
  name: dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  yearId: dto.academicYearId || dto.yearId || "",
  status: dto.status === "closed" ? "closed" : "open",
  startDate: dto.startDate,
  endDate: dto.endDate,
});

const mapStage = (dto: StageApiDto): Stage => ({
  id: dto.id,
  name: dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  order: dto.sortOrder ?? 1,
  description: dto.description ?? dto.notes,
});

const mapGrade = (dto: GradeApiDto): Grade => ({
  id: dto.id,
  name: dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  stageId: dto.stageId,
  capacity: dto.capacity ?? 0,
  order: dto.sortOrder ?? 1,
  notes: dto.notes,
});

const mapSection = (dto: SectionApiDto): Section => ({
  id: dto.id,
  name: dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  gradeId: dto.gradeId,
  capacity: dto.capacity ?? 0,
  order: dto.sortOrder ?? 1,
  notes: dto.notes,
});

const mapClassroom = (dto: ClassroomApiDto): Classroom => ({
  id: dto.id,
  name: dto.nameEn || dto.nameAr,
  nameAr: dto.nameAr,
  nameEn: dto.nameEn,
  sectionId: dto.sectionId,
  capacity: dto.capacity ?? 0,
  order: dto.sortOrder ?? 1,
  notes: dto.notes,
});

const mapStructureTree = (dto: AcademicStructureTreeApiDto): StructureTree => ({
  stages: (dto.stages || []).map(mapStage).sort((a, b) => a.order - b.order),
  grades:
    (dto.grades || []).length > 0
      ? (dto.grades || []).map(mapGrade)
      : (dto.stages || []).flatMap((stage) =>
          (stage.grades || []).map((grade) =>
            mapGrade({
              ...grade,
              stageId: grade.stageId || stage.id,
            })
          )
        ),
  sections:
    (dto.sections || []).length > 0
      ? (dto.sections || []).map(mapSection)
      : (dto.stages || []).flatMap((stage) =>
          (stage.grades || []).flatMap((grade) =>
            (grade.sections || []).map((section) =>
              mapSection({
                ...section,
                gradeId: section.gradeId || grade.id,
              })
            )
          )
        ),
  classrooms:
    (dto.classrooms || []).length > 0
      ? (dto.classrooms || []).map(mapClassroom)
      : (dto.stages || []).flatMap((stage) =>
          (stage.grades || []).flatMap((grade) =>
            (grade.sections || []).flatMap((section) =>
              (section.classrooms || []).map((classroom) =>
                mapClassroom({
                  ...classroom,
                  sectionId: classroom.sectionId || section.id,
                })
              )
            )
          )
        ),
});

const toAcademicYearPayload = (payload: Partial<Omit<AcademicYear, "id">>) => ({
  ...(typeof payload.nameAr !== "undefined" ? { nameAr: payload.nameAr } : {}),
  ...(typeof payload.nameEn !== "undefined" ? { nameEn: payload.nameEn } : {}),
  ...(typeof payload.startDate !== "undefined"
    ? { startDate: payload.startDate }
    : {}),
  ...(typeof payload.endDate !== "undefined" ? { endDate: payload.endDate } : {}),
  ...(typeof payload.isActive !== "undefined"
    ? { isActive: payload.isActive }
    : {}),
});

const toTermPayload = (payload: Partial<Omit<Term, "id">>) => ({
  ...(typeof payload.yearId !== "undefined"
    ? { academicYearId: payload.yearId }
    : {}),
  ...(typeof payload.nameAr !== "undefined" ? { nameAr: payload.nameAr } : {}),
  ...(typeof payload.nameEn !== "undefined" ? { nameEn: payload.nameEn } : {}),
  ...(typeof payload.startDate !== "undefined"
    ? { startDate: payload.startDate }
    : {}),
  ...(typeof payload.endDate !== "undefined" ? { endDate: payload.endDate } : {}),
  ...(typeof payload.status !== "undefined" ? { status: payload.status } : {}),
  ...(typeof payload.status !== "undefined"
    ? { isActive: payload.status === "open" }
    : {}),
});

const toStagePayload = (payload: Partial<Omit<Stage, "id">>) => ({
  ...(typeof payload.nameAr !== "undefined" ? { nameAr: payload.nameAr } : {}),
  ...(typeof payload.nameEn !== "undefined" ? { nameEn: payload.nameEn } : {}),
  ...(typeof payload.order !== "undefined" ? { sortOrder: payload.order } : {}),
  ...(typeof payload.description !== "undefined"
    ? { description: payload.description }
    : {}),
});

const toGradePayload = (payload: Partial<Omit<Grade, "id">>) => ({
  ...(typeof payload.stageId !== "undefined" ? { stageId: payload.stageId } : {}),
  ...(typeof payload.nameAr !== "undefined" ? { nameAr: payload.nameAr } : {}),
  ...(typeof payload.nameEn !== "undefined" ? { nameEn: payload.nameEn } : {}),
  ...(typeof payload.order !== "undefined" ? { sortOrder: payload.order } : {}),
  ...(typeof payload.capacity !== "undefined" ? { capacity: payload.capacity } : {}),
  ...(typeof payload.notes !== "undefined" ? { notes: payload.notes } : {}),
});

const toSectionPayload = (payload: Partial<Omit<Section, "id">>) => ({
  ...(typeof payload.gradeId !== "undefined" ? { gradeId: payload.gradeId } : {}),
  ...(typeof payload.nameAr !== "undefined" ? { nameAr: payload.nameAr } : {}),
  ...(typeof payload.nameEn !== "undefined" ? { nameEn: payload.nameEn } : {}),
  ...(typeof payload.order !== "undefined" ? { sortOrder: payload.order } : {}),
  ...(typeof payload.capacity !== "undefined"
    ? { capacity: payload.capacity }
    : {}),
  ...(typeof payload.notes !== "undefined" ? { notes: payload.notes } : {}),
});

const toClassroomPayload = (payload: Partial<Omit<Classroom, "id">>) => ({
  ...(typeof payload.sectionId !== "undefined"
    ? { sectionId: payload.sectionId }
    : {}),
  ...(typeof payload.nameAr !== "undefined" ? { nameAr: payload.nameAr } : {}),
  ...(typeof payload.nameEn !== "undefined" ? { nameEn: payload.nameEn } : {}),
  ...(typeof payload.order !== "undefined" ? { sortOrder: payload.order } : {}),
  ...(typeof payload.capacity !== "undefined"
    ? { capacity: payload.capacity }
    : {}),
  ...(typeof payload.notes !== "undefined" ? { notes: payload.notes } : {}),
});

const reorderNodes = async (
  basePath: string,
  resource: "stages" | "grades" | "sections" | "classrooms",
  orderedIds: string[]
) => {
  await Promise.all(
    orderedIds.map((id, index) =>
      unwrap<void>(
        apiWithToken(`${basePath}/${resource}/${id}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sortOrder: index + 1,
          }),
        })
      )
    )
  );
};

export const createStructureApiAdapter = (
  basePath: string = "/academics/structure"
): StructureAdapter => ({
  async fetchAcademicYears() {
    const years = await unwrap<AcademicYearApiDto[] | ApiListPayload<AcademicYearApiDto>>(
      apiWithToken(`${basePath}/years`, { method: "GET" })
    );
    return ensureList(years).map(mapAcademicYear);
  },

  async fetchTermsByYear(yearId) {
    const terms = await unwrap<TermApiDto[] | ApiListPayload<TermApiDto>>(
      apiWithToken(`${basePath}/terms${buildQuery({ yearId })}`, { method: "GET" })
    );

    const mapped = ensureList(terms).map(mapTerm);
    return mapped.filter((term) => term.yearId === yearId);
  },

  async createAcademicYear(payload) {
    const created = await unwrap<AcademicYearApiDto>(
      apiWithToken(`${basePath}/years`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toAcademicYearPayload(payload)),
      })
    );

    return mapAcademicYear(created);
  },

  async updateAcademicYear(id, payload) {
    const updated = await unwrap<AcademicYearApiDto>(
      apiWithToken(`${basePath}/years/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toAcademicYearPayload(payload)),
      })
    );

    return mapAcademicYear(updated);
  },

  async createTerm(payload) {
    const created = await unwrap<TermApiDto>(
      apiWithToken(`${basePath}/terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toTermPayload(payload)),
      })
    );

    return mapTerm(created);
  },

  async updateTerm(id, payload) {
    const updated = await unwrap<TermApiDto>(
      apiWithToken(`${basePath}/terms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toTermPayload(payload)),
      })
    );

    return mapTerm(updated);
  },

  async fetchStructureTree(yearId, termId) {
    const tree = await unwrap<AcademicStructureTreeApiDto>(
      apiWithToken(`${basePath}/tree${buildQuery({ yearId, termId })}`, {
        method: "GET",
      })
    );

    return mapStructureTree(tree);
  },

  async createStage(_yearId, termId, payload) {
    const created = await unwrap<StageApiDto>(
      apiWithToken(`${basePath}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId,
          nameAr: payload.nameAr,
          nameEn: payload.nameEn,
          sortOrder: payload.order ?? 1,
          description: payload.description,
        }),
      })
    );

    return mapStage(created);
  },

  async updateStage(_yearId, _termId, id, payload) {
    const updated = await unwrap<StageApiDto>(
      apiWithToken(`${basePath}/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toStagePayload(payload)),
      })
    );

    return mapStage(updated);
  },

  async deleteStage(_yearId, _termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/stages/${id}`, {
        method: "DELETE",
      })
    );
  },

  async reorderStages(_yearId, _termId, orderedStageIds) {
    await reorderNodes(basePath, "stages", orderedStageIds);
  },

  async createGrade(_yearId, termId, payload) {
    const created = await unwrap<GradeApiDto>(
      apiWithToken(`${basePath}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId,
          stageId: payload.stageId,
          nameAr: payload.nameAr,
          nameEn: payload.nameEn,
          sortOrder: payload.order,
          capacity: payload.capacity,
          notes: payload.notes,
        }),
      })
    );

    return mapGrade(created);
  },

  async updateGrade(_yearId, _termId, id, payload) {
    const updated = await unwrap<GradeApiDto>(
      apiWithToken(`${basePath}/grades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toGradePayload(payload)),
      })
    );

    return mapGrade(updated);
  },

  async deleteGrade(_yearId, _termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/grades/${id}`, {
        method: "DELETE",
      })
    );
  },

  async reorderGrades(_yearId, _termId, _stageId, orderedGradeIds) {
    await reorderNodes(basePath, "grades", orderedGradeIds);
  },

  async createSection(_yearId, termId, payload) {
    const created = await unwrap<SectionApiDto>(
      apiWithToken(`${basePath}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId,
          gradeId: payload.gradeId,
          nameAr: payload.nameAr,
          nameEn: payload.nameEn,
          sortOrder: payload.order,
          capacity: payload.capacity,
          notes: payload.notes,
        }),
      })
    );

    return mapSection(created);
  },

  async updateSection(_yearId, _termId, id, payload) {
    const updated = await unwrap<SectionApiDto>(
      apiWithToken(`${basePath}/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSectionPayload(payload)),
      })
    );

    return mapSection(updated);
  },

  async deleteSection(_yearId, _termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/sections/${id}`, {
        method: "DELETE",
      })
    );
  },

  async reorderSections(_yearId, _termId, _gradeId, orderedSectionIds) {
    await reorderNodes(basePath, "sections", orderedSectionIds);
  },

  async createClassroom(_yearId, termId, payload) {
    const created = await unwrap<ClassroomApiDto>(
      apiWithToken(`${basePath}/classrooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId,
          sectionId: payload.sectionId,
          nameAr: payload.nameAr,
          nameEn: payload.nameEn,
          sortOrder: payload.order,
          capacity: payload.capacity,
          notes: payload.notes,
        }),
      })
    );

    return mapClassroom(created);
  },

  async updateClassroom(_yearId, _termId, id, payload) {
    const updated = await unwrap<ClassroomApiDto>(
      apiWithToken(`${basePath}/classrooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toClassroomPayload(payload)),
      })
    );

    return mapClassroom(updated);
  },

  async deleteClassroom(_yearId, _termId, id) {
    await unwrap<void>(
      apiWithToken(`${basePath}/classrooms/${id}`, {
        method: "DELETE",
      })
    );
  },

  async reorderClassrooms(_yearId, _termId, _sectionId, orderedClassroomIds) {
    await reorderNodes(basePath, "classrooms", orderedClassroomIds);
  },
});

export const structureApiAdapter = createStructureApiAdapter();
