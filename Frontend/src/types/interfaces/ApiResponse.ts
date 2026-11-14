export interface ApiResponse<TData> {
  data?: TData;
  error?: { code?: string; message?: string };
}
