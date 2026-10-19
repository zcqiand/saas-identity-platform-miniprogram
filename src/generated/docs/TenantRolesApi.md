# TenantRolesApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**tenantRolesCreateSysRole**](TenantRolesApi.md#tenantrolescreatesysrole) | **POST** /api/v1/tenants/{tenantId}/roles |  |
| [**tenantRolesDeleteSysRole**](TenantRolesApi.md#tenantrolesdeletesysrole) | **DELETE** /api/v1/tenants/{tenantId}/roles/{roleId} |  |
| [**tenantRolesGetSysRole**](TenantRolesApi.md#tenantrolesgetsysrole) | **GET** /api/v1/tenants/{tenantId}/roles/{roleId} |  |
| [**tenantRolesListSysRoles**](TenantRolesApi.md#tenantroleslistsysroles) | **GET** /api/v1/tenants/{tenantId}/roles |  |
| [**tenantRolesUpdateSysRole**](TenantRolesApi.md#tenantrolesupdatesysrole) | **PATCH** /api/v1/tenants/{tenantId}/roles/{roleId} |  |



## tenantRolesCreateSysRole

> SysRole tenantRolesCreateSysRole(tenantId, createSysRoleRequest)



### Example

```ts
import {
  Configuration,
  TenantRolesApi,
} from '';
import type { TenantRolesCreateSysRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRolesApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // CreateSysRoleRequest
    createSysRoleRequest: ...,
  } satisfies TenantRolesCreateSysRoleRequest;

  try {
    const data = await api.tenantRolesCreateSysRole(body);
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
| **createSysRoleRequest** | [CreateSysRoleRequest](CreateSysRoleRequest.md) |  | |

### Return type

[**SysRole**](SysRole.md)

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


## tenantRolesDeleteSysRole

> tenantRolesDeleteSysRole(tenantId, roleId)



### Example

```ts
import {
  Configuration,
  TenantRolesApi,
} from '';
import type { TenantRolesDeleteSysRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRolesApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    roleId: roleId_example,
  } satisfies TenantRolesDeleteSysRoleRequest;

  try {
    const data = await api.tenantRolesDeleteSysRole(body);
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
| **roleId** | `string` |  | [Defaults to `undefined`] |

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


## tenantRolesGetSysRole

> SysRole tenantRolesGetSysRole(tenantId, roleId)



### Example

```ts
import {
  Configuration,
  TenantRolesApi,
} from '';
import type { TenantRolesGetSysRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRolesApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    roleId: roleId_example,
  } satisfies TenantRolesGetSysRoleRequest;

  try {
    const data = await api.tenantRolesGetSysRole(body);
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
| **roleId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**SysRole**](SysRole.md)

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


## tenantRolesListSysRoles

> TenantRolesListSysRoles200Response tenantRolesListSysRoles(tenantId, clientId, page, pageSize)



### Example

```ts
import {
  Configuration,
  TenantRolesApi,
} from '';
import type { TenantRolesListSysRolesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRolesApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string (optional)
    clientId: clientId_example,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies TenantRolesListSysRolesRequest;

  try {
    const data = await api.tenantRolesListSysRoles(body);
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
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |
| **page** | `number` |  | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**TenantRolesListSysRoles200Response**](TenantRolesListSysRoles200Response.md)

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


## tenantRolesUpdateSysRole

> SysRole tenantRolesUpdateSysRole(tenantId, roleId, updateSysRoleRequest)



### Example

```ts
import {
  Configuration,
  TenantRolesApi,
} from '';
import type { TenantRolesUpdateSysRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRolesApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    roleId: roleId_example,
    // UpdateSysRoleRequest
    updateSysRoleRequest: ...,
  } satisfies TenantRolesUpdateSysRoleRequest;

  try {
    const data = await api.tenantRolesUpdateSysRole(body);
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
| **roleId** | `string` |  | [Defaults to `undefined`] |
| **updateSysRoleRequest** | [UpdateSysRoleRequest](UpdateSysRoleRequest.md) |  | |

### Return type

[**SysRole**](SysRole.md)

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

