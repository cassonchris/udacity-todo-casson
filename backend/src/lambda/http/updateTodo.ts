import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { updateTodo } from '../../businessLogic/todoLogic'
import { NotFoundError, UnauthorizedError } from '../../businessLogic/errors'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodoRequest: UpdateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)

    try {
      await updateTodo(updatedTodoRequest, todoId, userId)

      return {
        statusCode: 200,
        body: ''
      }
    } catch (err) {
      let statusCode: number = 500
      if (err instanceof NotFoundError) {
        statusCode = 404
      } else if (err instanceof UnauthorizedError) {
        statusCode = 401
      }

      return {
        statusCode,
        body: JSON.stringify({
          message: err.message
        })
      }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
