# AdminClientsApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminClientsCreateClient**](AdminClientsApi.md#adminclientscreateclient) | **POST** /api/v1/admin/clients |  |
| [**adminClientsDeleteClient**](AdminClientsApi.md#adminclientsdeleteclient) | **DELETE** /api/v1/admin/clients/{clientId} |  |
| [**adminClientsGetClient**](AdminClientsApi.md#adminclientsgetclient) | **GET** /api/v1/admin/clients/{clientId} |  |
| [**adminClientsListClients**](AdminClientsApi.md#adminclientslistclients) | **GET** /api/v1/admin/clients |  |
| [**adminClientsSetClientStatus**](AdminClientsApi.md#adminclientssetclientstatusoperation) | **PATCH** /api/v1/admin/clients/{clientId}/status |  |
| [**adminClientsUpdateClient**](AdminClientsApi.md#adminclientsupdateclient) | **PATCH** /api/v1/admin/clients/{clientId} |  |



## adminClientsCreateClient

> OAuthClient adminClientsCreateClient(createOAuthClientRequest)



### Example

```ts
import {
  Configuration,
  AdminClientsApi,
} from '';
import type { AdminClientsCreateClientRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminClientsApi();

  const body = {
    // CreateOAuthClientRequest
    createOAuthClientRequest: ...,
  } satisfies AdminClientsCreateClientRequest;

  try {
    const data = await api.adminClientsCreateClient(body);
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
| **createOAuthClientRequest** | [CreateOAuthClientRequest](CreateOAuthClientRequest.md) |  | |

### Return type

[**OAuthClient**](OAuthClient.md)

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


## adminClientsDeleteClient

> adminClientsDeleteClient(clientId)



### Example

```ts
import {
  Configuration,
  AdminClientsApi,
} from '';
import type { AdminClientsDeleteClientRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminClientsApi();

  const body = {
    // string
    clientId: clientId_example,
  } satisfies AdminClientsDeleteClientRequest;

  try {
    const data = await api.adminClientsDeleteClient(body);
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


## adminClientsGetClient

> OAuthClient adminClientsGetClient(clientId)



### Example

```ts
import {
  Configuration,
  AdminClientsApi,
} from '';
import type { AdminClientsGetClientRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminClientsApi();

  const body = {
    // string
    clientId: clientId_example,
  } satisfies AdminClientsGetClientRequest;

  try {
    const data = await api.adminClientsGetClient(body);
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
| **clientId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**OAuthClient**](OAuthClient.md)

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


## adminClientsListClients

> AdminClientsListClients200Response adminClientsListClients(page, pageSize)



### Example

```ts
import {
  Configuration,
  AdminClientsApi,
} from '';
import type { AdminClientsListClientsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminClientsApi();

  const body = {
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies AdminClientsListClientsRequest;

  try {
    const data = await api.adminClientsListClients(body);
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

[**AdminClientsListClients200Response**](AdminClientsListClients200Response.md)

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


## adminClientsSetClientStatus

> OAuthClient adminClientsSetClientStatus(clientId, adminClientsSetClientStatusRequest)



### Example

```ts
import {
  Configuration,
  AdminClientsApi,
} from '';
import type { AdminClientsSetClientStatusOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminClientsApi();

  const body = {
    // string
    clientId: clientId_example,
    // AdminClientsSetClientStatusRequest
    adminClientsSetClientStatusRequest: ...,
  } satisfies AdminClientsSetClientStatusOperationRequest;

  try {
    const data = await api.adminClientsSetClientStatus(body);
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
| **clientId** | `string` |  | [Defaults to `undefined`] |
| **adminClientsSetClientStatusRequest** | [AdminClientsSetClientStatusRequest](AdminClientsSetClientStatusRequest.md) |  | |

### Return type

[**OAuthClient**](OAuthClient.md)

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


## adminClientsUpdateClient

> OAuthClient adminClientsUpdateClient(clientId, updateOAuthClientRequest)



### Example

```ts
import {
  Configuration,
  AdminClientsApi,
} from '';
import type { AdminClientsUpdateClientRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AdminClientsApi();

  const body = {
    // string
    clientId: clientId_example,
    // UpdateOAuthClientRequest
    updateOAuthClientRequest: ...,
  } satisfies AdminClientsUpdateClientRequest;

  try {
    const data = await api.adminClientsUpdateClient(body);
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
| **clientId** | `string` |  | [Defaults to `undefined`] |
| **updateOAuthClientRequest** | [UpdateOAuthClientRequest](UpdateOAuthClientRequest.md) |  | |

### Return type

[**OAuthClient**](OAuthClient.md)

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

