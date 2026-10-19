
# SysMenu


## Properties

Name | Type
------------ | -------------
`id` | string
`clientId` | string
`parentId` | string
`title` | string
`type` | [SysMenuType](SysMenuType.md)
`path` | string
`component` | string
`perms` | string
`icon` | string
`sortOrder` | number
`status` | number
`createdAt` | Date

## Example

```typescript
import type { SysMenu } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "clientId": null,
  "parentId": null,
  "title": null,
  "type": null,
  "path": null,
  "component": null,
  "perms": null,
  "icon": null,
  "sortOrder": null,
  "status": null,
  "createdAt": null,
} satisfies SysMenu

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SysMenu
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


