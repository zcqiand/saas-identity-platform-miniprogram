
# UpdateSysMenuRequest


## Properties

Name | Type
------------ | -------------
`parentId` | string
`title` | string
`type` | [SysMenuType](SysMenuType.md)
`path` | string
`component` | string
`perms` | string
`icon` | string
`sortOrder` | number
`status` | number

## Example

```typescript
import type { UpdateSysMenuRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "parentId": null,
  "title": null,
  "type": null,
  "path": null,
  "component": null,
  "perms": null,
  "icon": null,
  "sortOrder": null,
  "status": null,
} satisfies UpdateSysMenuRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateSysMenuRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


