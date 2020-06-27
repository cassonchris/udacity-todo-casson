import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { TodoItem } from '../../models/TodoItem'
import { getUserId } from '../utils'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    // get the existing todo
    const existingTodo = await getTodoById(todoId)

    // make sure the todo exists
    if (!existingTodo) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `could not find todo ${todoId}`
        })
      }
    }

    // make sure the todo is for the authenticated user
    if (existingTodo.userId !== userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'you are not authorized to delete this todo'
        })
      }
    }

    // delete the todo
    await docClient
      .delete({
        TableName: todosTable,
        Key: {
          userId: existingTodo.userId,
          createdAt: existingTodo.createdAt
        }
      })
      .promise()

    return {
      statusCode: 200,
      body: ''
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)

async function getTodoById(todoId: string): Promise<TodoItem> {
  // get the todo by todoId
  const result = await docClient
    .query({
      TableName: todosTable,
      IndexName: todoIdIndex,
      KeyConditionExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
        ':todoId': todoId
      }
    })
    .promise()

  // if there's a single result we're good
  if (result.Count === 1) {
    return result.Items[0]
  } else {
    // we didn't find the todo
    return null
  }
}
