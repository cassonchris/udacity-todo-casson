import { TodoAccess } from '../dataLayer/todoAccess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import * as uuid from 'uuid'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { NotFoundError, UnauthorizedError } from './errors'
import { S3Service } from '../services/S3Service'

const todoAccess = new TodoAccess()
const s3Service = new S3Service()

export async function createTodo(
  todo: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  const newTodo: TodoItem = {
    ...todo,
    userId,
    todoId,
    createdAt,
    done: false
  }

  return await todoAccess.createTodo(newTodo)
}

export async function getTodoById(todoId: string): Promise<TodoItem> {
  return await todoAccess.getTodoById(todoId)
}

export async function getTodosByUserId(userId: string): Promise<TodoItem[]> {
  return await todoAccess.getTodosByUserId(userId)
}

export async function getUploadUrl(
  todoId: string,
  userId: string
): Promise<string> {
  // get the existing todo
  const existingTodo = await getTodoById(todoId)

  // make sure the todo exists
  if (!existingTodo) {
    throw new NotFoundError(`could not find todo ${todoId}`)
  }

  // make sure the todo is for the authenticated user
  if (existingTodo.userId !== userId) {
    throw new UnauthorizedError(
      'you are not authorized to add an attachment to this todo'
    )
  }

  // get the uploadUrl
  const urls = s3Service.getAttachmentUrls(todoId)

  // update the todo
  existingTodo.attachmentUrl = urls[1]
  await todoAccess.updateTodo(existingTodo)

  // return the uploadUrl
  return urls[0]
}

export async function updateTodo(
  updatedTodoRequest: UpdateTodoRequest,
  todoId: string,
  userId: string
): Promise<TodoItem> {
  // get the existing todo
  const existingTodo = await getTodoById(todoId)

  // make sure the todo exists
  if (!existingTodo) {
    throw new NotFoundError(`could not find todo ${todoId}`)
  }

  // make sure the todo is for the authenticated user
  if (existingTodo.userId !== userId) {
    throw new UnauthorizedError('you are not authorized to update this todo')
  }

  // assign the new values to the existing todo
  const updatedTodo = { ...existingTodo, ...updatedTodoRequest }

  // update the todo
  return await todoAccess.updateTodo(updatedTodo)
}

export async function deleteTodo(todoId: string, userId: string) {
  // get the existing todo
  const existingTodo = await getTodoById(todoId)

  // make sure the todo exists
  if (!existingTodo) {
    throw new NotFoundError(`could not find todo ${todoId}`)
  }

  // make sure the todo is for the authenticated user
  if (existingTodo.userId !== userId) {
    throw new UnauthorizedError('you are not authorized to delete this todo')
  }

  await todoAccess.deleteTodo(existingTodo)
}
