export interface PhaseItemType {
  phase: string;
  production: number;
  unit: string;
  assignmentNormCode?: string;
  adjustmentNormCode?: string;
  assignmentCodes: any[];
}

export interface GroupScopeType {
  productionScope: string;
  phases: PhaseItemType[];
}

export interface InitialPlannedCostFormType {
  _id?: string;
  department: string;
  month: string;
  groups: GroupScopeType[];
}
