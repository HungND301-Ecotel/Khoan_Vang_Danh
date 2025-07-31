export interface LoginType {
    username: string;
    password: string;
}

//
export interface AssignmentCodeInputType {
    _id?: string;
    code?: string;
    name: string;
    uom?: string,
    price?: number,
    deviceCode?: string,

}
export interface AssignmentCodeOutputType {
    _id?: string;
    code?: string;
    name: string;
    uom?: UnitType,
    price?: number,
    deviceCode?: DeviceCodeType,
}
//

export interface Materials {
    _id?: string;
    code?: string;
    name: string;
    uom?: UnitType;
    assignmentCode?: AssignmentCodeOutputType;
    quantity?: number,
    priceHistory: {
        price: number,
        startDate: Date,
        endDate: Date
    }[],
    currentPrice?: number
}
export interface MaterialAssignmentOutputType {
    _id?: string;
    name: string;
    code: string;
    uom: string;
    price: number,
    materials: Materials[]
}
export interface MaterialAssignmentInputType {
    _id?: string;
    code?: string;
    name: string;
    uom?: string;
    assignmentCode?: string;
    priceHistory: {
        price?: number,
        startDate?: string,
        endDate?: string
    }[],
}
export interface UnitType {
    _id?: string;
    name: string
}

//
export interface ExcavationTechType {
    _id?: string;
    name: string
}
//
export interface HardnessType {
    _id?: string;
    name: string;
}
//
export interface CrossSectionInputType {
    _id?: string;
    name: string;
    uom?: string
}
export interface CrossSectionOutputType {
    _id?: string;
    name: string,
    uom?: UnitType
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
    phaseGroup?: PhaseGroupType
}
export interface PhaseInputType {
    _id?: string;
    code?: string;
    name: string;
    phaseGroup?: string
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
    name: string
}
//
export interface ExcavationNormInputType {
    _id?: string;
    code: string,
    phase?: string,
    phaseGroup?: string,
    step?: string,
    hardness?: string,
    excavationTech?: string,
    norms: {
        assignmentCode: string,
        norm?: number
    }[]
}
export interface ExcavationNormOutputType {
    _id?: string;
    code: string,
    phase?: PhaseInputType,
    phaseGroup?: PhaseGroupType,
    step?: StepType,
    hardness?: HardnessType,
    excavationTech?: ExcavationTechType,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}
//

export interface CuttingNormInputType {
    _id?: string;
    code: string,
    phase?: string,
    phaseGroup?: string,
    hardness?: string,
    crossSection?: string,
    norms: {
        assignmentCode: string,
        norm?: number
    }[]
}
export interface CuttingNormOutputType {
    _id?: string;
    code: string,
    phase?: PhaseInputType,
    phaseGroup?: PhaseGroupType,
    hardness?: HardnessType,
    crossSection?: CrossSectionOutputType,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}
//

export interface CoalCuttingNormZRYInputType {
    _id?: string;
    code: string,
    length?: string;
    hardness?: string,
    thickness?: string,
    norms: {
        assignmentCode: string,
        norm?: number
    }[]
}
export interface CoalCuttingNormZRYOutputType {
    _id?: string;
    code: string,
    length?: LengthType;
    hardness?: HardnessType,
    thickness?: ThicknessType,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}
//


export interface CoalCuttingNormZHInputType {
    _id?: string;
    code: string,
    length?: string;
    hardness?: string,
    thickness?: string,
    norms: {
        assignmentCode: string,
        norm?: number
    }[]
}
export interface CoalCuttingNormZHOutputType {
    _id?: string;
    code: string,
    length?: LengthType;
    hardness?: HardnessType,
    thickness?: ThicknessType,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}
//

export interface CoalCuttingNormKBInputType {
    _id?: string;
    code: string,
    curbSlope?: string;
    hardness?: string,
    thickness?: string,
    norms: {
        assignmentCode: string,
        norm?: number
    }[]
}
export interface CoalCuttingNormKBOutputType {
    _id?: string;
    code: string,
    curbSlope?: CurbSlopeType;
    hardness?: HardnessType,
    thickness?: ThicknessType,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}

//
export interface RockRatioType {
    _id?: string;
    name: string
}
//
export interface MirrorRatioType {
    _id?: string;
    name: string
}
//


export interface AdjustmentNormKInputType {
    _id?: string;
    code: string,
    rockRatio?: string,
    hardness?: string,
    type: string,
    norms: {
        assignmentCode?: string,
        norm?: number
    }[]
}
export interface AdjustmentNormKOutputType {
    _id?: string;
    code: string,
    rockRatio?: RockRatioType,
    hardness?: HardnessType,
    type: string,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}
//


export interface AdjustmentNormCMInputType {
    _id?: string;
    code: string,
    mirrorRatio?: string,
    norms: {
        assignmentCode?: string,
        norm?: number
    }[]
}
export interface AdjustmentNormCMOutputType {
    _id?: string;
    code: string,
    mirrorRatio?: MirrorRatioType,
    norms: {
        assignmentCode: AssignmentCodeOutputType,
        norm?: number
    }[]
}

//
export interface ProductionScopeInputType {
    _id?: string;
    code: string,
    name: string
    phases: {
        phase?: string,
        production?: number
    }[]
}
export interface ProductionScopeOutputType {
    _id?: string;
    code: string,
    name: string
    phases: {
        phase?: PhaseGroupType,
        production?: number
    }[]
}

//
export interface DeviceCodeType {
    _id?: string;
    code: string,
}