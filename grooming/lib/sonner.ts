// Mock implementation of the sonner toast library

export const toast = {
  success: (message: string) => {
    console.log(`[SUCCESS TOAST]: ${message}`);
  },
  error: (message: string) => {
    console.error(`[ERROR TOAST]: ${message}`);
  },
  info: (message: string) => {
    console.info(`[INFO TOAST]: ${message}`);
  },
  warning: (message: string) => {
    console.warn(`[WARNING TOAST]: ${message}`);
  },
  loading: (message: string) => {
    console.log(`[LOADING TOAST]: ${message}`);
    return {
      success: (successMessage: string) => {
        console.log(`[SUCCESS TOAST]: ${successMessage}`);
      },
      error: (errorMessage: string) => {
        console.error(`[ERROR TOAST]: ${errorMessage}`);
      }
    };
  },
  promise: (promise: Promise<any>, options: any) => {
    console.log(`[PROMISE TOAST]: ${options.loading}`);
    promise
      .then(() => console.log(`[SUCCESS TOAST]: ${options.success}`))
      .catch(() => console.error(`[ERROR TOAST]: ${options.error}`));
  }
};
