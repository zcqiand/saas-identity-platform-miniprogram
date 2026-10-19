
# TenantMembership


## Properties

Name | Type
------------ | -------------
`id` | string
`userId` | string
`tenantId` | string
`roleIds` | Array&lt;string&gt;
`status` | [TenantMemberStatus](TenantMemberStatus.md)
`joinedAt` | Date

## Example

```typescript
import type { TenantMembership } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "userId": null,
  "tenantId": null,
  "roleIds": null,
  "status": null,
  "joinedAt": null,
} satisfies TenantMembership

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TenantMembership
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


