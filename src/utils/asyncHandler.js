/*
The asyncHandler function return the function with argument req, res, next. 
The return function will wrap with Promise if there is error in Promise we use catch part. 
*/

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export {asyncHandler};

/*
const asyncHandler = (fn) => async (req, res, next) => {
   try {
        await fn(req, res, next)
     } catch (error) {
         res.status(err.code || 500).json({
             success: false,
             message: err.message
         })
     }
 }
*/