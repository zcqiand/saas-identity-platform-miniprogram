
# SysUser


## Properties

Name | Type
------------ | -------------
`id` | string
`username` | string
`email` | string
`mobile` | string
`status` | [SysUserStatus](SysUserStatus.md)
`failedAttempts` | number
`lockedUntil` | Date
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { SysUser } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "username": null,
  "email": null,
  "mobile": null,
  "status": null,
  "failedAttempts": null,
  "lockedUntil": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies SysUser

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SysUser
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


