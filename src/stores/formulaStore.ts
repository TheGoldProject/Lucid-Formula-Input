import { create } from "zustand";

interface FormulaState {
  formula: { type: string; name?: string; value: string | number }[];
  setFormula: (newFormula: { type: string; name?: string; value: string | number }[]) => void;
}

export const useFormulaStore = create<FormulaState>((set) => ({
  formula: [],
  setFormula: (newFormula) => set({ formula: newFormula }),
}));
