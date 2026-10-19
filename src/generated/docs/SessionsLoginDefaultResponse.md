
# SessionsLoginDefaultResponse


## Properties

Name | Type
------------ | -------------
`code` | string
`message` | string
`lockedUntil` | Date
`remainingAttempts` | number
`details` | { [key: string]: object; }

## Example

```typescript
import type { SessionsLoginDefaultResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "code": BAD_REQUEST,
  "message": null,
  "lockedUntil": null,
  "remainingAttempts": null,
  "details": null,
} satisfies SessionsLoginDefaultResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SessionsLoginDefaultResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


