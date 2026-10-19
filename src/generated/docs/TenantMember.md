
# TenantMember


## Properties

Name | Type
------------ | -------------
`id` | string
`tenantId` | string
`userId` | string
`memberName` | string
`isOwner` | boolean
`status` | [TenantMemberStatus](TenantMemberStatus.md)
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { TenantMember } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "tenantId": null,
  "userId": null,
  "memberName": null,
  "isOwner": null,
  "status": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies TenantMember

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TenantMember
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


