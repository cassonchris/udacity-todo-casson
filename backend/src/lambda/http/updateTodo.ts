import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { TodoItem } from '../../models/TodoItem'
import { getUserId } from '../utils'

const XAWS = AWSXRay.capture(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODO_ID_INDEX

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodoRequest: UpdateTodoRequest = JSON.parse(event.body)
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
          message: 'you are not authorized to update this todo'
        })
      }
    }

    // assign the new values to the existing todo
    const updatedTodo = { existingTodo, ...updatedTodoRequest }

    // send the updated todo to the docClient
    await docClient.put({
      TableName: todosTable,
      Item: updatedTodo
    })

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
      IndexName: todosIdIndex,
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
