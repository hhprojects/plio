import { create } from "zustand";

interface ParentStore {
  selectedStudentId: string | null;
  students: Array<{ id: string; fullName: string }>;
  setSelectedStudentId: (id: string | null) => void;
  setStudents: (students: Array<{ id: string; fullName: string }>) => void;
}

export const useParentStore = create<ParentStore>((set) => ({
  selectedStudentId: null,
  students: [],
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  setStudents: (students) =>
    set({
      students,
      selectedStudentId: students.length > 0 ? students[0].id : null,
    }),
}));
