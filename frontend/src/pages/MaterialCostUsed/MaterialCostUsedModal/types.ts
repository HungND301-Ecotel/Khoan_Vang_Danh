export interface PreviewRow {
  id: number;
  code: string;
  materialName: string;
  quantity: number;
  status: string;
  message: string;
  matchingmaterial: any;
  matchingassignment: any;
  matchingMaterials: any[];
  availableAssignments: any[];
  selectedAssignmentId: string;
  selectedAssignmentName?: string;
}
