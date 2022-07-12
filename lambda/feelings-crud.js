const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

const findByProject = async project => {
  const params = {
    TableName: "feelings-data",
    FilterExpression: '#project = :project',
    ExpressionAttributeNames: {"#project": "project"},
    ExpressionAttributeValues: {
      ":project": project
    }
  };
  return await dynamo
    .scan(params)
    .promise();
};

const findByProjectAndValue = async (project, value) => {
  const params = {
    TableName: "feelings-data",
    FilterExpression: '#project=:project and #value=:value',
    ExpressionAttributeNames: {"#project": "project", "#value": "value"},
    ExpressionAttributeValues: {
      ":project": project,
      ":value": parseInt(value)
    }
  };
  return await dynamo
    .scan(params)
    .promise();
};

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    switch (event.routeKey) {
      case "GET /feelings":
        body = await dynamo.scan({ TableName: "feelings-data" }).promise();
        break;
      case "GET /feelings/{project}":
        body = await findByProject(event.pathParameters.project);
        break;
      case "GET /feelings/{project}/value/{value}":
        body = await findByProjectAndValue(event.pathParameters.project, event.pathParameters.value);
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
