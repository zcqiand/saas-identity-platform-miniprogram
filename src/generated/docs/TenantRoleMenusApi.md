# TenantRoleMenusApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**tenantRoleMenusClearSysRoleMenus**](TenantRoleMenusApi.md#tenantrolemenusclearsysrolemenus) | **DELETE** /api/v1/tenants/{tenantId}/roles/{roleId}/menus |  |
| [**tenantRoleMenusListSysRoleMenus**](TenantRoleMenusApi.md#tenantrolemenuslistsysrolemenus) | **GET** /api/v1/tenants/{tenantId}/roles/{roleId}/menus |  |
| [**tenantRoleMenusSetSysRoleMenus**](TenantRoleMenusApi.md#tenantrolemenussetsysrolemenus) | **PUT** /api/v1/tenants/{tenantId}/roles/{roleId}/menus |  |



## tenantRoleMenusClearSysRoleMenus

> tenantRoleMenusClearSysRoleMenus(tenantId, roleId, clientId)



### Example

```ts
import {
  Configuration,
  TenantRoleMenusApi,
} from '';
import type { TenantRoleMenusClearSysRoleMenusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRoleMenusApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    roleId: roleId_example,
    // string (optional)
    clientId: clientId_example,
  } satisfies TenantRoleMenusClearSysRoleMenusRequest;

  try {
    const data = await api.tenantRoleMenusClearSysRoleMenus(body);
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
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |

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


## tenantRoleMenusListSysRoleMenus

> RoleMenuGrant tenantRoleMenusListSysRoleMenus(tenantId, roleId, clientId)



### Example

```ts
import {
  Configuration,
  TenantRoleMenusApi,
} from '';
import type { TenantRoleMenusListSysRoleMenusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRoleMenusApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    roleId: roleId_example,
    // string (optional)
    clientId: clientId_example,
  } satisfies TenantRoleMenusListSysRoleMenusRequest;

  try {
    const data = await api.tenantRoleMenusListSysRoleMenus(body);
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
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**RoleMenuGrant**](RoleMenuGrant.md)

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


## tenantRoleMenusSetSysRoleMenus

> RoleMenuGrant tenantRoleMenusSetSysRoleMenus(tenantId, roleId, setSysRoleMenusRequest, clientId)



### Example

```ts
import {
  Configuration,
  TenantRoleMenusApi,
} from '';
import type { TenantRoleMenusSetSysRoleMenusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantRoleMenusApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    roleId: roleId_example,
    // SetSysRoleMenusRequest
    setSysRoleMenusRequest: ...,
    // string (optional)
    clientId: clientId_example,
  } satisfies TenantRoleMenusSetSysRoleMenusRequest;

  try {
    const data = await api.tenantRoleMenusSetSysRoleMenus(body);
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
| **setSysRoleMenusRequest** | [SetSysRoleMenusRequest](SetSysRoleMenusRequest.md) |  | |
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**RoleMenuGrant**](RoleMenuGrant.md)

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

