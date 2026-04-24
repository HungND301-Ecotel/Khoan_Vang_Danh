import { atom } from 'jotai';

export interface SystemConfigType {
    key: string;
    value: string;
    description: string;
}

export const systemConfigsAtom = atom<SystemConfigType[]>([]);

// Helper to get value by key
export const getSystemConfigValueAtom = (key: string) => atom((get) => {
    const configs = get(systemConfigsAtom);
    return configs.find(c => c.key === key)?.value || "";
});
