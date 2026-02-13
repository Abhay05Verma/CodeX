function ok(res, data = {}, message = "OK", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, status = 500, message = "Request failed", error) {
  return res.status(status).json({
    success: false,
    message,
    error: error ? { message: String(error) } : undefined,
  });
}

module.exports = {
  ok,
  fail,
};
