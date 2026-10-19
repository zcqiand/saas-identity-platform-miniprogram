
# LoginResponse


## Properties

Name | Type
------------ | -------------
`user` | [SysUser](SysUser.md)
`availableTenants` | [Array&lt;TenantMembership&gt;](TenantMembership.md)
`userId` | string
`currentTenantId` | string
`accessToken` | string
`refreshToken` | string
`tokenType` | string
`expiresIn` | number
`clientId` | string

## Example

```typescript
import type { LoginResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "user": null,
  "availableTenants": null,
  "userId": null,
  "currentTenantId": null,
  "accessToken": null,
  "refreshToken": null,
  "tokenType": null,
  "expiresIn": null,
  "clientId": null,
} satisfies LoginResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LoginResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


