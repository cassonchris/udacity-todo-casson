import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { TodoItem } from '../../models/TodoItem'
import * as uuid from 'uuid'

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)

    const todoId = uuid.v4()
    const userId = getUserId(event)
    const createdAt = new Date().toISOString()

    const newTodo: TodoItem = {
      ...newTodoRequest,
      userId,
      todoId,
      createdAt,
      done: false
    }

    await docClient.put({
      TableName: todosTable,
      Item: newTodo
    })

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newTodo
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
