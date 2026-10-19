
# Tenant


## Properties

Name | Type
------------ | -------------
`id` | string
`tenantKey` | string
`name` | string
`status` | [TenantStatus](TenantStatus.md)
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { Tenant } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "tenantKey": null,
  "name": null,
  "status": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies Tenant

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Tenant
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


