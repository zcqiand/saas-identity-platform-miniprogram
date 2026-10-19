
# UpdateOAuthClientRequest


## Properties

Name | Type
------------ | -------------
`clientName` | string
`grantTypes` | string
`redirectUris` | string
`scopes` | string
`accessTokenValidity` | number
`refreshTokenValidity` | number
`autoApprove` | boolean
`status` | number

## Example

```typescript
import type { UpdateOAuthClientRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "clientName": null,
  "grantTypes": null,
  "redirectUris": null,
  "scopes": null,
  "accessTokenValidity": null,
  "refreshTokenValidity": null,
  "autoApprove": null,
  "status": null,
} satisfies UpdateOAuthClientRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateOAuthClientRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


