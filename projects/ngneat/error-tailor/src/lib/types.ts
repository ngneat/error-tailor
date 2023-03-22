export type ErrMsgFn = (err: any) => string;
export type ErrorsMap = Record<string, string | ErrMsgFn>;
