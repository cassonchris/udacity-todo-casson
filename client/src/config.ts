// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = '...'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  domain: 'dev-58bkvb9a.us.auth0.com', // Auth0 domain
  clientId: 'ymg7l36U3i5Hx8XK7v0YVqeJFXFC1Oq1', // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
