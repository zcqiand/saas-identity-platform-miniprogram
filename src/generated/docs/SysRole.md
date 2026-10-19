
# SysRole


## Properties

Name | Type
------------ | -------------
`id` | string
`tenantId` | string
`clientId` | string
`roleCode` | string
`roleName` | string
`description` | string
`isPreset` | boolean
`status` | number
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { SysRole } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "tenantId": null,
  "clientId": null,
  "roleCode": null,
  "roleName": null,
  "description": null,
  "isPreset": null,
  "status": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies SysRole

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SysRole
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


