// Mock for sign-with-signtool to avoid import.meta issue during testing
export const signWithSigntool = jest.fn(() => Promise.resolve());