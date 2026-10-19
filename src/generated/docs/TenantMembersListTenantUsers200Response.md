
# TenantMembersListTenantUsers200Response


## Properties

Name | Type
------------ | -------------
`items` | [Array&lt;TenantMemberUserView&gt;](TenantMemberUserView.md)
`page` | number
`pageSize` | number
`total` | number

## Example

```typescript
import type { TenantMembersListTenantUsers200Response } from ''

// TODO: Update the object below with actual values
const example = {
  "items": null,
  "page": 0,
  "pageSize": 20,
  "total": 0,
} satisfies TenantMembersListTenantUsers200Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TenantMembersListTenantUsers200Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


