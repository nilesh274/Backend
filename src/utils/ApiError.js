class ApiError extends Error{   
    // Extends words work in this form 
    // ApiError class have the in build Error class.
    // This means that ApiError inherits all the functionality of the Error class
    constructor(
        statusCode, 
        message = "Something went wrong",
        errors = [],
        statck = ""
    ){
        super(message)     // It is confirm to overwrite the message super is in build function 
        this.statusCode = statusCode
        this.data = null
        this.message =message
        this.success = false
        this.errors = errors


        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}