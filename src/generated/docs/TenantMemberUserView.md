
# TenantMemberUserView


## Properties

Name | Type
------------ | -------------
`id` | string
`tenantId` | string
`username` | string
`email` | string
`status` | [TenantMemberStatus](TenantMemberStatus.md)
`roleIds` | Array&lt;string&gt;
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { TenantMemberUserView } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "tenantId": null,
  "username": null,
  "email": null,
  "status": null,
  "roleIds": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies TenantMemberUserView

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TenantMemberUserView
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


