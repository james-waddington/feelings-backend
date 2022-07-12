const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    switch (event.routeKey) {
      case "GET /feelings/{id}":
        body = await dynamo
          .get({
            TableName: "feelings-data",
            Key: {
              id: event.pathParameters.id
            }
          })
          .promise();
        break;
      case "GET /feelings":
        body = await dynamo.scan({ TableName: "feelings-data" }).promise();
        break;
      case "PUT /feelings":
        let requestJSON = JSON.parse(event.body);
        const {project, userId, value, time, location, tags} = requestJSON;
        let id = project + "#" + userId + "#" + time
        await dynamo
          .put({
            TableName: "feelings-data",
            Item: {
              id,
              project,
              userId,
              value,
              time,
              location,
              tags
            }
          })
          .promise();
        body = `Put item ${id}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers
  };
};
