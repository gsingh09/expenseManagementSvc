class ResponseModel {
  constructor(success, data = null, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static success(data) {
    return new ResponseModel(true, data);
  }

  static error(error) {
    return new ResponseModel(false, null, error);
  }
}

module.exports = ResponseModel;
