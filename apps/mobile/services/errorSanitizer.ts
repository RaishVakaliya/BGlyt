export function sanitizeError(error: any): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  let errMsg = "";
  let errCode = "";
  let status: number | undefined = undefined;

  if (typeof error === "string") {
    errMsg = error;
  } else if (typeof error === "object") {
    errMsg = error.message || error.detail || error.errorMessage || "";
    errCode = error.code || "";
    status = error.status || error.response?.status;

    if (!errMsg && error.response?.data) {
      const data = error.response.data;
      if (typeof data === "string") {
        errMsg = data;
      } else if (data && typeof data === "object") {
        errMsg = data.detail || data.message || "";
      }
    }
  }

  if (!errMsg) {
    errMsg = String(error);
  }

  const lowerMsg = errMsg.toLowerCase();
  const lowerCode = String(errCode).toLowerCase();

  const isNetworkError =
    errCode === "ERR_NETWORK" ||
    lowerCode.includes("network") ||
    lowerMsg.includes("network") ||
    lowerMsg.includes("internet") ||
    lowerMsg.includes("connection") ||
    lowerMsg.includes("unable to resolve host") ||
    lowerMsg.includes("no address associated with hostname") ||
    lowerMsg.includes("failed to connect") ||
    lowerMsg.includes("offline") ||
    lowerMsg.includes("timeout");

  if (isNetworkError) {
    return "No internet connection. Please connect to the internet and try again.";
  }

  if (status && status >= 500) {
    return "Server is temporarily unavailable. Please try again in a few moments.";
  }

  if (
    lowerMsg.includes("bad gateway") ||
    lowerMsg.includes("service unavailable") ||
    lowerMsg.includes("gateway timeout") ||
    lowerMsg.includes("500") ||
    lowerMsg.includes("502") ||
    lowerMsg.includes("503") ||
    lowerMsg.includes("504")
  ) {
    return "Server is temporarily unavailable. Please try again in a few moments.";
  }

  if (
    lowerMsg.includes("hf.space") ||
    lowerMsg.includes("huggingface") ||
    lowerMsg.includes("localhost") ||
    lowerMsg.includes("http://") ||
    lowerMsg.includes("https://") ||
    lowerMsg.includes("exception") ||
    lowerMsg.includes("failed to remove background") ||
    lowerMsg.includes("unexpected token") ||
    lowerMsg.includes("uploadasync")
  ) {
    return "Unable to process image. Please try again or select a different image.";
  }

  if (errMsg.length < 150 && !/[\{\}\[\]\/\:\\]/.test(errMsg)) {
    return errMsg;
  }

  return "Failed to remove background image. Please try again.";
}
