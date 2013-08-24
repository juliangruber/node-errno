function init (type, message, cause) {
  addEnumerable(this, 'type', type)
  // backwards compatibility
  this.name      = type
  // can be passed just a 'cause'
  this.cause     = typeof message != 'string' ? message : cause
  this.message   = !!message && typeof message != 'string' ? message.message : message
}

// set obj[key] = value and make it enumerable if possible
function addEnumerable (obj, key, value) {
  if (Object.defineProperty) {
    Object.defineProperty(obj, key, {
        value: value
      , enumerable: true
      , writable: true
      , readable: true
    })
  } else {
    obj[key] = value
    return obj
  } 
}

// generic prototype, not intended to be actually used - helpful for `instanceof`
function CustomError (message, cause) {
  Error.call(this)
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, arguments.callee)
  init.call(this, 'CustomError', message, cause)
}

CustomError.prototype = new Error()

function createError (errno, type, proto) {
  var err = function (message, cause) {
    init.call(this, type, message, cause)
    //TODO: the specificity here is stupid, errno should be available everywhere
    if (type == 'FilesystemError') {
      this.code    = this.cause.code
      this.path    = this.cause.path
      this.errno   = this.cause.errno
      this.message =
        (errno.errno[this.cause.errno]
          ? errno.errno[this.cause.errno].description
          : this.cause.message)
        + (this.cause.path ? ' [' + this.cause.path + ']' : '')
    }
    Error.call(this)
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, arguments.callee)
  }
  err.prototype = !!proto ? new proto() : new CustomError()
  return err
}

module.exports = function (errno) {
  var ce = function (type, proto) {
    return createError(errno, type, proto)
  }
  return {
      CustomError     : CustomError
    , FilesystemError : ce('FilesystemError')
    , createError     : ce
  }
}
