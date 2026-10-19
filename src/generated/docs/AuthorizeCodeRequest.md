
# AuthorizeCodeRequest


## Properties

Name | Type
------------ | -------------
`clientId` | string
`redirectUri` | string
`responseType` | string
`scope` | string
`state` | string

## Example

```typescript
import type { AuthorizeCodeRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "clientId": null,
  "redirectUri": null,
  "responseType": null,
  "scope": null,
  "state": null,
} satisfies AuthorizeCodeRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AuthorizeCodeRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


