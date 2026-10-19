
# CurrentUser


## Properties

Name | Type
------------ | -------------
`id` | string
`email` | string
`memberships` | [Array&lt;TenantMembership&gt;](TenantMembership.md)
`currentTenantId` | string

## Example

```typescript
import type { CurrentUser } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "email": null,
  "memberships": null,
  "currentTenantId": null,
} satisfies CurrentUser

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CurrentUser
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


