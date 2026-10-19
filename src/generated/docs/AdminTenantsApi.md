# AdminTenantsApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminTenantsCreateTenant**](AdminTenantsApi.md#admintenantscreatetenant) | **POST** /api/v1/admin/tenants |  |
| [**adminTenantsDeleteTenant**](AdminTenantsApi.md#admintenantsdeletetenant) | **DELETE** /api/v1/admin/tenants/{id} |  |
| [**adminTenantsGetTenant**](AdminTenantsApi.md#admintenantsgettenant) | **GET** /api/v1/admin/tenants/{id} |  |
| [**adminTenantsListTenants**](AdminTenantsApi.md#admintenantslisttenants) | **GET** /api/v1/admin/tenants |  |
| [**adminTenantsUpdateTenant**](AdminTenantsApi.md#admintenantsupdatetenant) | **PATCH** /api/v1/admin/tenants/{id} |  |



## adminTenantsCreateTenant

> Tenant adminTenantsCreateTenant(createTenantRequest)



### Example

```ts
import {
  Configuration,
  AdminTenantsApi,
} from '';
import type { AdminTenantsCreateTenantRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminTenantsApi();

  const body = {
    // CreateTenantRequest
    createTenantRequest: ...,
  } satisfies AdminTenantsCreateTenantRequest;

  try {
    const data = await api.adminTenantsCreateTenant(body);
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
| **createTenantRequest** | [CreateTenantRequest](CreateTenantRequest.md) |  | |

### Return type

[**Tenant**](Tenant.md)

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


## adminTenantsDeleteTenant

> adminTenantsDeleteTenant(id)



### Example

```ts
import {
  Configuration,
  AdminTenantsApi,
} from '';
import type { AdminTenantsDeleteTenantRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminTenantsApi();

  const body = {
    // string
    id: id_example,
  } satisfies AdminTenantsDeleteTenantRequest;

  try {
    const data = await api.adminTenantsDeleteTenant(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

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


## adminTenantsGetTenant

> Tenant adminTenantsGetTenant(id)



### Example

```ts
import {
  Configuration,
  AdminTenantsApi,
} from '';
import type { AdminTenantsGetTenantRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminTenantsApi();

  const body = {
    // string
    id: id_example,
  } satisfies AdminTenantsGetTenantRequest;

  try {
    const data = await api.adminTenantsGetTenant(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Tenant**](Tenant.md)

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


## adminTenantsListTenants

> AdminTenantsListTenants200Response adminTenantsListTenants(page, pageSize)



### Example

```ts
import {
  Configuration,
  AdminTenantsApi,
} from '';
import type { AdminTenantsListTenantsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminTenantsApi();

  const body = {
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies AdminTenantsListTenantsRequest;

  try {
    const data = await api.adminTenantsListTenants(body);
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
| **page** | `number` |  | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AdminTenantsListTenants200Response**](AdminTenantsListTenants200Response.md)

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


## adminTenantsUpdateTenant

> Tenant adminTenantsUpdateTenant(id, updateTenantRequest)



### Example

```ts
import {
  Configuration,
  AdminTenantsApi,
} from '';
import type { AdminTenantsUpdateTenantRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminTenantsApi();

  const body = {
    // string
    id: id_example,
    // UpdateTenantRequest
    updateTenantRequest: ...,
  } satisfies AdminTenantsUpdateTenantRequest;

  try {
    const data = await api.adminTenantsUpdateTenant(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **updateTenantRequest** | [UpdateTenantRequest](UpdateTenantRequest.md) |  | |

### Return type

[**Tenant**](Tenant.md)

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

