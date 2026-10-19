# MeApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**meGetMyMenus**](MeApi.md#megetmymenus) | **GET** /api/v1/me/menus |  |
| [**meListMyTenants**](MeApi.md#melistmytenants) | **GET** /api/v1/me/tenants |  |
| [**meSwitchTenant**](MeApi.md#meswitchtenant) | **POST** /api/v1/me/tenants/{tenantId}/switch |  |
| [**meWhoami**](MeApi.md#mewhoami) | **GET** /api/v1/me |  |



## meGetMyMenus

> { [key: string]: Array&lt;EffectiveMenuNode&gt;; } meGetMyMenus(clientId)



### Example

```ts
import {
  Configuration,
  MeApi,
} from '';
import type { MeGetMyMenusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new MeApi();

  const body = {
    // string (optional)
    clientId: clientId_example,
  } satisfies MeGetMyMenusRequest;

  try {
    const data = await api.meGetMyMenus(body);
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
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

**{ [key: string]: Array<EffectiveMenuNode>; }**

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


## meListMyTenants

> Array&lt;TenantMembership&gt; meListMyTenants(clientId)



### Example

```ts
import {
  Configuration,
  MeApi,
} from '';
import type { MeListMyTenantsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new MeApi();

  const body = {
    // string (optional)
    clientId: clientId_example,
  } satisfies MeListMyTenantsRequest;

  try {
    const data = await api.meListMyTenants(body);
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
| **clientId** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;TenantMembership&gt;**](TenantMembership.md)

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


## meSwitchTenant

> SwitchTenantResponse meSwitchTenant(tenantId, clientId)



### Example

```ts
import {
  Configuration,
  MeApi,
} from '';
import type { MeSwitchTenantRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new MeApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string (optional)
    clientId: clientId_example,
  } satisfies MeSwitchTenantRequest;

  try {
    const data = await api.meSwitchTenant(body);
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

### Return type

[**SwitchTenantResponse**](SwitchTenantResponse.md)

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


## meWhoami

> CurrentUser meWhoami()



### Example

```ts
import {
  Configuration,
  MeApi,
} from '';
import type { MeWhoamiRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new MeApi();

  try {
    const data = await api.meWhoami();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**CurrentUser**](CurrentUser.md)

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

