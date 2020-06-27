import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { createTodo } from '../../businessLogic/todoLogic'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)

    const userId = getUserId(event)

    const newTodo = await createTodo(newTodoRequest, userId)

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
