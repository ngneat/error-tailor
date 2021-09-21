import { Observable } from 'rxjs';

export type HashMap<T = any> = {
  [err: string]: T;
};
export type ErrMsgFn = (err: any) => string | Observable<string>;
export type ErrorsMap = HashMap<string | ErrMsgFn>;
