export interface FormulaTag {
  type: "tag";
  name: string;
  value: string | number;
}

export interface FormulaText {
  type: "text";
  value: string;
}

export type FormulaItem = FormulaTag | FormulaText; 