import { atom } from 'jotai';

export interface TabItem {
  id: string; // usually pathname
  title: string;
  path: string;
}

export const tabsAtom = atom<TabItem[]>([]);
export const activeTabIdAtom = atom<string>('/');

// Maps a pathname to its minimized modal state
export const minimizedModalsAtom = atom<
  Record<string, { isMinimized: boolean; restoring: boolean; data: any; title?: string }>
>({});

// Helper mapping for standard titles
export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Tổng quan',
  '/department': 'Phân xưởng',
  '/unit': 'Đơn vị tính',
  '/devicecode': 'Mã thiết bị',
  '/assignmentcode': 'Mã giao khoán',
  '/materialassignment': 'Vật tư trong khoán',
  '/materialassignmentoutplan': 'Vật tư khác',
  '/rockratio': 'Tỷ lệ đá lẫn trong gương',
  '/mirrorratio': 'Tỷ lệ gương than mềm',
  '/adjustmentfactorfornorms': 'Hệ số điều chỉnh định mức',
  '/ratedadjustmentfactor': 'Công đoạn sản xuất',
  '/parameter': 'Thông số',
  '/productionscope': 'Diện sản xuất',
  '/materialunitprice': 'Đơn giá vật tư giao khoán',
  '/excavationnorms': 'Định mức đào lò',
  '/cuttingnorms': 'Định mức xén lò',
  '/coalcuttingnorms': 'Định mức khấu than',
  '/initialplannedcosts': 'Chi phí kế hoạch ban đầu',
  '/materialcostused': 'Chi phí vật tư thực hiện',
  '/materialbudget': 'Chi phí vật tư kế hoạch',
  '/settlementReportSummary': 'Quyết toán giao khoán',
  '/report/technologykpireport': 'Báo cáo',
};
