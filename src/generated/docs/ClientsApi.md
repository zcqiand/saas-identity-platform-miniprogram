# ClientsApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**clientsGetClient**](ClientsApi.md#clientsgetclient) | **GET** /api/v1/clients/{clientId} |  |



## clientsGetClient

> OAuthClientPublicInfo clientsGetClient(clientId)



### Example

```ts
import {
  Configuration,
  ClientsApi,
} from '';
import type { ClientsGetClientRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientsApi();

  const body = {
    // string
    clientId: clientId_example,
  } satisfies ClientsGetClientRequest;

  try {
    const data = await api.clientsGetClient(body);
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

[**OAuthClientPublicInfo**](OAuthClientPublicInfo.md)

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

