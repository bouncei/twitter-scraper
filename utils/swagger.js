const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

module.exports = (app) => {
  app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
