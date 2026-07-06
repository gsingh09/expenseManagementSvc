class SuccessResponse {
  static build(data, statusCode = 200) {
    return {
      statusCode,
      body: {
        success: true,
        data
      }
    };
  }

  static created(data) {
    return this.build(data, 201);
  }

  static ok(data) {
    return this.build(data, 200);
  }
}

module.exports = SuccessResponse;
