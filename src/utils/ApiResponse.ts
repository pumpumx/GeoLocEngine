export class ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  timestamp: string;

  constructor(params: {
    success: boolean;
    message: string;
    data?: T;
    error?: unknown;
  }) {
    this.success = params.success;
    this.message = params.message;
    this.data = params.data;
    this.error = params.error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(
    data?: T,
    message = "Success"
  ): ApiResponse<T> {
    return new ApiResponse({
      success: true,
      message,
      data,
    });
  }

  static failure(
    message = "Something went wrong",
    error?: unknown
  ): ApiResponse {
    return new ApiResponse({
      success: false,
      message,
      error,
    });
  }
}