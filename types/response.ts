export interface ApiResponse<T> {
  success: boolean
  data: T
  errorMessage: string
}
