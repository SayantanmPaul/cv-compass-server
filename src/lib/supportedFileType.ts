export const isValidResumeFileType = (mimeType: string) => {
  const supportedTypes = [
    "application/pdf",
  ];
  return supportedTypes.includes(mimeType);
};
