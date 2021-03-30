function success(res, json) {
  res.status(200);
  res.json({
    success: true,
    response: json,
  });
  res.end();
}

function failure(res, e) {
  const errorMessage = (e && e.message) || e
  console.log('--> failure:', errorMessage)
  res.status(400);
  res.json({
    success: false,
    error: errorMessage,
  });
  res.end();
}

function failure200(res, e) {
  res.status(200);
  res.json({
    success: false,
    error: (e && e.message) || e,
  });
  res.end();
}

export { success, failure, failure200 }