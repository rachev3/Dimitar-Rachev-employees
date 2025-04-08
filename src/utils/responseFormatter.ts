export const successResponse = <T>(data: T, message?: string) => {
  const response: {
    success: true;
    data: T;
    message?: string;
  } = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
};

export const errorResponse = (message: string, errorDetails?: any) => {
  const response: {
    success: false;
    message: string;
    error?: any;
  } = {
    success: false,
    message,
  };

  if (errorDetails) {
    response.error = errorDetails;
  }

  return response;
};

export const messageResponse = (message: string) => {
  return {
    success: true,
    message,
  };
};
