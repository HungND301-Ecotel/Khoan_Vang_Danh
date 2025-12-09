
export interface LoginType {
  username: string;
  password: string;
}

export interface MaterialFormValues {
  _id?: string;
  code?: string;
  name?: string;
  uom?: UnitType;
  quantity?: number;
  currentPrice?: number;
}
export interface FlatMaterial {
  _id: string;
  code: string;
  materialCode?: string;
  name: string;
  uom?: string;
  quantity?: number;
  price?: number;
  note: string;
}

export interface PrivateRouteProps {
  children: React.ReactNode;
}

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export interface FlatMaterial {
  _id: string;
  code: string;
  materialCode?: string;
  name: string;
  uom?: string;
  quantity?: number;
  price?: number;
  note: string;
}

export interface PhaseType {
  phaseGroup: string;
  phase: string;
  assignmentNormCode: string;
  production: number | undefined;
  adjustmentNormCode: string;
  unit?: string;
}

export interface FormValues {
  code: string;
  phases: PhaseType[];
}

//
export interface AssignmentCodeInputType {
  _id?: string;
  code?: string;
  name: string;
  uom?: string;
  price?: number;
  deviceCode?: string;
}
export interface AssignmentCodeOutputType {
  _id?: string;
  code?: string;
  name: string;
  uom?: UnitType;
  price?: number;
  deviceCode?: DeviceCodeType;
}
//

export interface Materials {
  _id?: string;
  code?: string;
  name: string;
  uom?: UnitType;
  assignmentCode?: AssignmentCodeOutputType;
  quantity?: number;
  priceHistory: {
    price: number;
    startDate: Date;
    endDate: Date;
  }[];
  currentPrice?: number;
}
export interface MaterialAssignmentOutputType {
  _id?: string;
  name: string;
  code: string;
  uom: string;
  price: number;
  device: string;
  materials: Materials[];
}
export interface MaterialAssignmentInputType {
  _id?: string;
  code?: string;
  name: string;
  quantity?: number;
  currentPrice?: number;
  assignmentCode?: string;
  priceHistory: {
    price?: number;
    startDate?: string;
    endDate?: string;
  }[];
}
export interface UnitType {
  _id?: string;
  name: string;
}

//
export interface ExcavationTechType {
  _id?: string;
  name: string;
}
//
export interface HardnessType {
  _id?: string;
  name: string;
  uom?: UnitType;
}
//
export interface CrossSectionInputType {
  _id?: string;
  name: string;
  uom?: string;
}
export interface CrossSectionOutputType {
  _id?: string;
  name: string;
  uom?: UnitType;
}
//
export interface PhaseGroupType {
  _id?: string;
  code?: string;
  name: string;
}
//
export interface PhaseOutputType {
  _id?: string;
  code?: string;
  name: string;
  phaseGroup?: PhaseGroupType;
}
export interface PhaseInputType {
  name?: string;
  _id?: string;
  phaseGroup: string;
  phase: string;
  assignmentNormCode: string;
  production?: number;
  adjustmentNormCode: string;
}
//
export interface CurbSlopeType {
  _id?: string;
  name: string;
}
//
export interface ThicknessType {
  _id?: string;
  name: string;
}
//
export interface LengthType {
  _id?: string;
  name: string;
}
//
export interface MiningtechType {
  _id?: string;
  code: string;
  name: string;
}
//
export interface StepType {
  _id?: string;
  name: string;
}
//
export interface ExcavationNormInputType {
  _id?: string;
  code: string;
  phase?: string;
  phaseGroup?: string;
  hardness?: string;
  step?: string;
  excavationTech?: string;
  norms: {
    assignmentCode: string;
    norm?: number;
  }[];
}
export interface ExcavationNormOutputType {
  _id?: string;
  code: string;
  phase?: PhaseInputType;
  phaseGroup?: PhaseGroupType;
  hardness?: HardnessType;
  step?: StepType;
  excavationTech?: ExcavationTechType;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//

export interface CuttingNormInputType {
  _id?: string;
  code: string;
  phase?: string;
  phaseGroup?: string;
  crossSection?: string;
  hardness?: string;
  norms: {
    assignmentCode: string;
    norm?: number;
  }[];
}
export interface CuttingNormOutputType {
  _id?: string;
  code: string;
  phase?: PhaseInputType;
  phaseGroup?: PhaseGroupType;
  crossSection?: CrossSectionOutputType;
  hardness?: HardnessType;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//

export interface CoalCuttingNormZRYInputType {
  _id?: string;
  code: string;
  length?: string;
  hardness?: string;
  thickness?: string;
  norms: {
    assignmentCode: string;
    norm?: number;
  }[];
}
export interface CoalCuttingNormZRYOutputType {
  _id?: string;
  code: string;
  length?: LengthType;
  hardness?: HardnessType;
  thickness?: ThicknessType;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//

export interface CoalCuttingNormZHInputType {
  _id?: string;
  code: string;
  length?: string;
  hardness?: string;
  thickness?: string;
  norms: {
    assignmentCode: string;
    norm?: number;
  }[];
}
export interface CoalCuttingNormZHOutputType {
  _id?: string;
  code: string;
  length?: LengthType;
  hardness?: HardnessType;
  thickness?: ThicknessType;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//

export interface CoalCuttingNormKBInputType {
  _id?: string;
  code: string;
  curbSlope?: string;
  hardness?: string;
  thickness?: string;
  norms: {
    assignmentCode: string;
    norm?: number;
  }[];
}
export interface CoalCuttingNormKBOutputType {
  _id?: string;
  code: string;
  curbSlope?: CurbSlopeType;
  hardness?: HardnessType;
  thickness?: ThicknessType;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}

//

export interface AssignmentNormInputType {
  _id?: string;
  code: string;
  phase?: string;
  phaseGroup?: string;
  crossSection?: string;
  length?: string;
  curbSlope?: string;
  hardness?: string;
  thickness?: string;
  step?: string;
  excavationTech?: string;
  type: "cutting" | "excavation" | "coal_kb" | "coal_zh" | "coal_zry";
  norms: {
    assignmentCode: string;
    norm?: number;
  }[];
}
export interface AssignmentNormOutputType {
  _id?: string;
  name?: string;
  code: string;
  phase?: PhaseInputType;
  phaseGroup?: PhaseGroupType;
  crossSection?: CrossSectionOutputType;
  length?: LengthType;
  curbSlope?: CurbSlopeType;
  hardness?: HardnessType;
  thickness?: ThicknessType;
  step?: StepType;
  excavationTech?: ExcavationTechType;
  type: "cutting" | "excavation" | "coal_kb" | "coal_zh" | "coal_zry";
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//
export interface RockRatioType {
  _id?: string;
  name: string;
}
//
export interface MirrorRatioType {
  _id?: string;
  name: string;
}
//

export interface AdjustmentNormKInputType {
  _id?: string;
  code: string;
  rockRatio?: string;
  hardness?: string;
  type: string;
  norms: {
    assignmentCode?: string;
    norm?: number;
  }[];
}
export interface AdjustmentNormKOutputType {
  _id?: string;
  code: string;
  rockRatio?: RockRatioType;
  hardness?: HardnessType;
  type: string;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//

export interface AdjustmentNormCMInputType {
  _id?: string;
  code: string;
  mirrorRatio?: string;
  norms: {
    assignmentCode?: string;
    norm?: number;
  }[];
}
export interface AdjustmentNormCMOutputType {
  _id?: string;
  code: string;
  mirrorRatio?: MirrorRatioType;
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}
//
export interface AdjustmentNormInputType {
  _id?: string;
  code: string;
  rockRatio?: string;
  hardness?: string;
  mirrorRatio?: string;
  type: "CM" | "CKKT" | "CKĐL";
  norms: {
    assignmentCode?: string;
    norm?: number;
  }[];
}
export interface AdjustmentNormOutputType {
  _id?: string;
  code: string;
  rockRatio?: RockRatioType;
  hardness?: HardnessType;
  mirrorRatio?: MirrorRatioType;
  type: "CM" | "CKKT" | "CKĐL";
  norms: {
    assignmentCode: AssignmentCodeOutputType;
    norm?: number;
  }[];
}

//
export interface ProductionScopeInputType {
  _id?: string;
  code: string;
  name: string;
  phases: {
    phase?: string;
    // production?: number;
  }[];
}
export interface ProductionScopeOutputType {
  _id?: string;
  code: string;
  name: string;
  phases: {
    phase?: PhaseOutputType;
    // production?: number;
  }[];
}

//
export interface DeviceCodeType {
  _id?: string;
  code: string;
}

//

export interface MaterialBudgetInputType {
  _id?: string;
  code: string;
  phases: PhaseInputType[];
  phaseGroup?: string;
  production?: number;
  assignmentNormCode: string;
  adjustmentNormCode: string;
}

//

export interface MaterialBudgetOutputType {
  _id?: string;
  code: string;
  phase?: PhaseOutputType;
  phaseGroup?: PhaseGroupType;
  production?: number;
  assignmentNormCode?: AssignmentNormOutputType;
  adjustmentNormCode?: AdjustmentNormOutputType;
}

//

export interface MaterialCostUsedInputType {
  _id?: string;
  productionScope?: string;
  month: string,
  phases: {
    phase: string;
    production: number;
    unit: string;
    assignmentNormCode: string;
    adjustmentNormCode: string;
  }[];
  materials: {
    material?: string;
    quantity: number;
  };
}

export interface MaterialCostUsedOutputType {
  _id?: string;
  productionScope?: ProductionScopeOutputType;
  month: string,
  group: {
    _id: string,
    month: string,
    phases: {
      phase: PhaseGroupType;
      production: number;
      unit: string;
      assignmentNormCode: string;
      adjustmentNormCode: string;
    }[];
    materials: {
      assignmentCode: AssignmentCodeInputType;
      price: number,
      materials: {
        material?: Materials;
        quantity: number;
        price: number;
        cost: number;
      }[]
    }[];
    totalUsedCost: number
  }[]
}

//
export interface InitialPlannedCostInputType {
  _id?: string;
  productionScope?: string;
  month: string,
  phases: {
    phase: string;
    production: number;
    unit: string;
    assignmentNormCode: string;
    adjustmentNormCode: string;
  }[];
}

export interface InitialPlannedCostOutputType {
  _id?: string;
  productionScope?: ProductionScopeOutputType;
  month: string,
  group: {
    _id: string,
    month: string,
    phases: {
      key: string,
      phase: PhaseGroupType;
      production: number;
      unit: string;
      assignmentNormCode: AssignmentNormOutputType;
      adjustmentNormCode: AssignmentNormOutputType;
      totalInitialPlannedCost: number,
      initialPlannedCostDetails: {
        assignmentCode: AssignmentCodeOutputType,
        baseNorm: number,
        adjustmentNorm: number,
        norm: number,
        quantity: number,
        price: number,
        cost: number
      }[],
    }[];
    totalInitialPlannedCost: number
  }[]
}
//
export interface MaterialBudgetCostType {
  _id?: string;
  productionScope?: ProductionScopeOutputType;
  month: string,
  group: {
    _id: string,
    month: string,
    phases: {
      key: string,
      phase: PhaseGroupType;
      production: number;
      unit: string;
      assignmentNormCode: AssignmentNormOutputType;
      adjustmentNormCode: AssignmentNormOutputType;
      totalBudgetCost: number,
      budgetCostDetails: {
        assignmentCode: AssignmentCodeOutputType,
        baseNorm: number,
        adjustmentNorm: number,
        norm: number,
        quantity: number,
        price: number,
        cost: number
      }[],
    }[];
    totalBudgetCost: number
  }[]
}
