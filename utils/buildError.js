export function buildError(statusCode , message , data ) {
    let err  = new Error(message);
    err.statusCode = statusCode;
    if (data != null) err.data = data;
    return err;
  }