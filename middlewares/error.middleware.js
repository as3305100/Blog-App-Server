export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? "fail" : "error";
    this.isOperational = true;
    this.errors = errors;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAsync = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            next(error)
        }
    }
}

export const errorHandler = (err, req, res, next) => {
   const statusCode = err.statusCode || 500;
   const status = err.status || "error";

   if(process.env.NODE_ENV === "development") {
      return res.status(statusCode).json({
         status: status,
         errors: err.errors,
         message: err.message,
         statusCode: statusCode
      })
   } else {
      if(err.isOperational){
         res.status(statusCode).json({
            status: status,
            statusCode: statusCode,
            message: err.message,
            errors: err.errors 
         })
      }else{
         res.status(statusCode).json({
            status: "error",
            message: "something went wrong"
         })
      }
   }

}
