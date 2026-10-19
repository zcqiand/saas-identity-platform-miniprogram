# TenantMembersApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**tenantMembersAssignTenantMemberRoles**](TenantMembersApi.md#tenantmembersassigntenantmemberroles) | **PUT** /api/v1/tenants/{tenantId}/members/{userId}/roles |  |
| [**tenantMembersChangeTenantUserStatus**](TenantMembersApi.md#tenantmemberschangetenantuserstatusoperation) | **PATCH** /api/v1/tenants/{tenantId}/members/{userId}/status |  |
| [**tenantMembersCreateTenantUser**](TenantMembersApi.md#tenantmemberscreatetenantuser) | **POST** /api/v1/tenants/{tenantId}/members |  |
| [**tenantMembersDeleteTenantUser**](TenantMembersApi.md#tenantmembersdeletetenantuser) | **DELETE** /api/v1/tenants/{tenantId}/members/{userId} |  |
| [**tenantMembersGetTenantUser**](TenantMembersApi.md#tenantmembersgettenantuser) | **GET** /api/v1/tenants/{tenantId}/members/{userId} |  |
| [**tenantMembersInviteTenantUser**](TenantMembersApi.md#tenantmembersinvitetenantuseroperation) | **POST** /api/v1/tenants/{tenantId}/members/invitations |  |
| [**tenantMembersListTenantUsers**](TenantMembersApi.md#tenantmemberslisttenantusers) | **GET** /api/v1/tenants/{tenantId}/members |  |
| [**tenantMembersUpdateTenantUser**](TenantMembersApi.md#tenantmembersupdatetenantuser) | **PATCH** /api/v1/tenants/{tenantId}/members/{userId} |  |



## tenantMembersAssignTenantMemberRoles

> TenantMemberUserView tenantMembersAssignTenantMemberRoles(tenantId, userId, setTenantMemberRolesRequest)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersAssignTenantMemberRolesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    userId: userId_example,
    // SetTenantMemberRolesRequest
    setTenantMemberRolesRequest: ...,
  } satisfies TenantMembersAssignTenantMemberRolesRequest;

  try {
    const data = await api.tenantMembersAssignTenantMemberRoles(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **userId** | `string` |  | [Defaults to `undefined`] |
| **setTenantMemberRolesRequest** | [SetTenantMemberRolesRequest](SetTenantMemberRolesRequest.md) |  | |

### Return type

[**TenantMemberUserView**](TenantMemberUserView.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersChangeTenantUserStatus

> TenantMemberUserView tenantMembersChangeTenantUserStatus(tenantId, userId, tenantMembersChangeTenantUserStatusRequest)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersChangeTenantUserStatusOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    userId: userId_example,
    // TenantMembersChangeTenantUserStatusRequest
    tenantMembersChangeTenantUserStatusRequest: ...,
  } satisfies TenantMembersChangeTenantUserStatusOperationRequest;

  try {
    const data = await api.tenantMembersChangeTenantUserStatus(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **userId** | `string` |  | [Defaults to `undefined`] |
| **tenantMembersChangeTenantUserStatusRequest** | [TenantMembersChangeTenantUserStatusRequest](TenantMembersChangeTenantUserStatusRequest.md) |  | |

### Return type

[**TenantMemberUserView**](TenantMemberUserView.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersCreateTenantUser

> TenantMemberUserView tenantMembersCreateTenantUser(tenantId, createSysUserRequest)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersCreateTenantUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // CreateSysUserRequest
    createSysUserRequest: ...,
  } satisfies TenantMembersCreateTenantUserRequest;

  try {
    const data = await api.tenantMembersCreateTenantUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **createSysUserRequest** | [CreateSysUserRequest](CreateSysUserRequest.md) |  | |

### Return type

[**TenantMemberUserView**](TenantMemberUserView.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersDeleteTenantUser

> tenantMembersDeleteTenantUser(tenantId, userId)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersDeleteTenantUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    userId: userId_example,
  } satisfies TenantMembersDeleteTenantUserRequest;

  try {
    const data = await api.tenantMembersDeleteTenantUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **userId** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | There is no content to send for this request, but the headers may be useful.  |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersGetTenantUser

> TenantMemberUserView tenantMembersGetTenantUser(tenantId, userId)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersGetTenantUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    userId: userId_example,
  } satisfies TenantMembersGetTenantUserRequest;

  try {
    const data = await api.tenantMembersGetTenantUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **userId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**TenantMemberUserView**](TenantMemberUserView.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersInviteTenantUser

> TenantMemberView tenantMembersInviteTenantUser(tenantId, tenantMembersInviteTenantUserRequest)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersInviteTenantUserOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // TenantMembersInviteTenantUserRequest
    tenantMembersInviteTenantUserRequest: ...,
  } satisfies TenantMembersInviteTenantUserOperationRequest;

  try {
    const data = await api.tenantMembersInviteTenantUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **tenantMembersInviteTenantUserRequest** | [TenantMembersInviteTenantUserRequest](TenantMembersInviteTenantUserRequest.md) |  | |

### Return type

[**TenantMemberView**](TenantMemberView.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersListTenantUsers

> TenantMembersListTenantUsers200Response tenantMembersListTenantUsers(tenantId, page, pageSize, status)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersListTenantUsersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
    // TenantMemberStatus (optional)
    status: ...,
  } satisfies TenantMembersListTenantUsersRequest;

  try {
    const data = await api.tenantMembersListTenantUsers(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **page** | `number` |  | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `undefined`] |
| **status** | `TenantMemberStatus` |  | [Optional] [Defaults to `undefined`] [Enum: active, invited, suspended, disabled] |

### Return type

[**TenantMembersListTenantUsers200Response**](TenantMembersListTenantUsers200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tenantMembersUpdateTenantUser

> TenantMemberUserView tenantMembersUpdateTenantUser(tenantId, userId, updateSysUserRequest)



### Example

```ts
import {
  Configuration,
  TenantMembersApi,
} from '';
import type { TenantMembersUpdateTenantUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantMembersApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    userId: userId_example,
    // UpdateSysUserRequest
    updateSysUserRequest: ...,
  } satisfies TenantMembersUpdateTenantUserRequest;

  try {
    const data = await api.tenantMembersUpdateTenantUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tenantId** | `string` |  | [Defaults to `undefined`] |
| **userId** | `string` |  | [Defaults to `undefined`] |
| **updateSysUserRequest** | [UpdateSysUserRequest](UpdateSysUserRequest.md) |  | |

### Return type

[**TenantMemberUserView**](TenantMemberUserView.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The request has succeeded. |  -  |
| **0** | An unexpected error response. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

