
# TokenRequest


## Properties

Name | Type
------------ | -------------
`grantType` | string
`code` | string
`refreshToken` | string
`clientId` | string
`clientSecret` | string
`redirectUri` | string

## Example

```typescript
import type { TokenRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "grantType": null,
  "code": null,
  "refreshToken": null,
  "clientId": null,
  "clientSecret": null,
  "redirectUri": null,
} satisfies TokenRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TokenRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


