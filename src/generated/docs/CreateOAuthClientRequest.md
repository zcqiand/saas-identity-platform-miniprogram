
# CreateOAuthClientRequest


## Properties

Name | Type
------------ | -------------
`clientId` | string
`clientName` | string
`clientSecret` | string
`grantTypes` | string
`redirectUris` | string
`scopes` | string
`accessTokenValidity` | number
`refreshTokenValidity` | number
`autoApprove` | boolean

## Example

```typescript
import type { CreateOAuthClientRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "clientId": null,
  "clientName": null,
  "clientSecret": null,
  "grantTypes": null,
  "redirectUris": null,
  "scopes": null,
  "accessTokenValidity": null,
  "refreshTokenValidity": null,
  "autoApprove": null,
} satisfies CreateOAuthClientRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateOAuthClientRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


