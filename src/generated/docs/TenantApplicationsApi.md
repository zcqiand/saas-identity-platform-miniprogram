# TenantApplicationsApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**tenantApplicationsListTenantApplications**](TenantApplicationsApi.md#tenantapplicationslisttenantapplications) | **GET** /api/v1/tenants/{tenantId}/applications |  |
| [**tenantApplicationsRemoveTenantApplication**](TenantApplicationsApi.md#tenantapplicationsremovetenantapplication) | **DELETE** /api/v1/tenants/{tenantId}/applications/{clientId} |  |
| [**tenantApplicationsSubscribeTenantApplication**](TenantApplicationsApi.md#tenantapplicationssubscribetenantapplication) | **POST** /api/v1/tenants/{tenantId}/applications |  |
| [**tenantApplicationsUpdateTenantApplication**](TenantApplicationsApi.md#tenantapplicationsupdatetenantapplication) | **PATCH** /api/v1/tenants/{tenantId}/applications/{clientId} |  |



## tenantApplicationsListTenantApplications

> TenantApplicationsListTenantApplications200Response tenantApplicationsListTenantApplications(tenantId, page, pageSize)



### Example

```ts
import {
  Configuration,
  TenantApplicationsApi,
} from '';
import type { TenantApplicationsListTenantApplicationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantApplicationsApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies TenantApplicationsListTenantApplicationsRequest;

  try {
    const data = await api.tenantApplicationsListTenantApplications(body);
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

### Return type

[**TenantApplicationsListTenantApplications200Response**](TenantApplicationsListTenantApplications200Response.md)

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


## tenantApplicationsRemoveTenantApplication

> tenantApplicationsRemoveTenantApplication(tenantId, clientId)



### Example

```ts
import {
  Configuration,
  TenantApplicationsApi,
} from '';
import type { TenantApplicationsRemoveTenantApplicationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantApplicationsApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    clientId: clientId_example,
  } satisfies TenantApplicationsRemoveTenantApplicationRequest;

  try {
    const data = await api.tenantApplicationsRemoveTenantApplication(body);
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
| **clientId** | `string` |  | [Defaults to `undefined`] |

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


## tenantApplicationsSubscribeTenantApplication

> TenantApplication tenantApplicationsSubscribeTenantApplication(tenantId, subscribeTenantApplicationRequest)



### Example

```ts
import {
  Configuration,
  TenantApplicationsApi,
} from '';
import type { TenantApplicationsSubscribeTenantApplicationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantApplicationsApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // SubscribeTenantApplicationRequest
    subscribeTenantApplicationRequest: ...,
  } satisfies TenantApplicationsSubscribeTenantApplicationRequest;

  try {
    const data = await api.tenantApplicationsSubscribeTenantApplication(body);
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
| **subscribeTenantApplicationRequest** | [SubscribeTenantApplicationRequest](SubscribeTenantApplicationRequest.md) |  | |

### Return type

[**TenantApplication**](TenantApplication.md)

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


## tenantApplicationsUpdateTenantApplication

> TenantApplication tenantApplicationsUpdateTenantApplication(tenantId, clientId, updateTenantApplicationRequest)



### Example

```ts
import {
  Configuration,
  TenantApplicationsApi,
} from '';
import type { TenantApplicationsUpdateTenantApplicationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TenantApplicationsApi();

  const body = {
    // string
    tenantId: tenantId_example,
    // string
    clientId: clientId_example,
    // UpdateTenantApplicationRequest
    updateTenantApplicationRequest: ...,
  } satisfies TenantApplicationsUpdateTenantApplicationRequest;

  try {
    const data = await api.tenantApplicationsUpdateTenantApplication(body);
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
| **clientId** | `string` |  | [Defaults to `undefined`] |
| **updateTenantApplicationRequest** | [UpdateTenantApplicationRequest](UpdateTenantApplicationRequest.md) |  | |

### Return type

[**TenantApplication**](TenantApplication.md)

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

