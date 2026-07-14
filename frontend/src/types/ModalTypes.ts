import { Dispatch, SetStateAction } from "react";

export interface BaseConfigModalProps<TInput, TOutput> {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<TInput>) => void;
  selected: TOutput | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
}
