
# OAuthClient


## Properties

Name | Type
------------ | -------------
`id` | string
`clientId` | string
`clientName` | string
`grantTypes` | string
`redirectUris` | string
`scopes` | string
`accessTokenValidity` | number
`refreshTokenValidity` | number
`autoApprove` | boolean
`status` | number
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { OAuthClient } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "clientId": null,
  "clientName": null,
  "grantTypes": null,
  "redirectUris": null,
  "scopes": null,
  "accessTokenValidity": null,
  "refreshTokenValidity": null,
  "autoApprove": null,
  "status": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies OAuthClient

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OAuthClient
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


