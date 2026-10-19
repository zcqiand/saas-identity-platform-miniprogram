
# TenantApplication


## Properties

Name | Type
------------ | -------------
`id` | string
`tenantId` | string
`clientId` | string
`status` | number
`expireTime` | Date
`createdAt` | Date

## Example

```typescript
import type { TenantApplication } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "tenantId": null,
  "clientId": null,
  "status": null,
  "expireTime": null,
  "createdAt": null,
} satisfies TenantApplication

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TenantApplication
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


