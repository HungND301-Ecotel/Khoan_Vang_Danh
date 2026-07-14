import { useAtom } from "jotai";
import { minimizedModalsAtom } from "../atoms/tabAtoms";
import { useLocation } from "react-router-dom";
import { useEffect, Dispatch, SetStateAction } from "react";

export default function useMinimizedModal<T = any>(
  setOpen: Dispatch<SetStateAction<boolean>>,
  title: string = "Đang soạn..."
) {
  const location = useLocation();
  const [minimizedModals, setMinimizedModals] = useAtom(minimizedModalsAtom);
  const minimizedState = minimizedModals[location.pathname];
  const minimizedData = minimizedState?.data as T | undefined;

  useEffect(() => {
    if (minimizedState?.restoring) {
      setOpen(true);
      setMinimizedModals((prev) => ({
        ...prev,
        [location.pathname]: {
          ...prev[location.pathname],
          restoring: false,
          isMinimized: false,
        },
      }));
    }
  }, [minimizedState?.restoring, location.pathname, setMinimizedModals, setOpen]);

  const handleMinimize = (data: T) => {
    setMinimizedModals((prev) => ({
      ...prev,
      [location.pathname]: {
        isMinimized: true,
        restoring: false,
        data,
        title,
      },
    }));
    setOpen(false);
  };

  const clearMinimize = () => {
    setMinimizedModals((prev) => {
      const next = { ...prev };
      delete next[location.pathname];
      return next;
    });
  };

  return {
    minimizedData,
    handleMinimize,
    clearMinimize,
  };
}
