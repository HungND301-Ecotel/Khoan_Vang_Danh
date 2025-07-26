import { atomWithStorage } from 'jotai/vanilla/utils'
export const userAtom = atomWithStorage<any | null>('user', null)