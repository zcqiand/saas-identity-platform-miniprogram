# OauthApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**oAuthAuthorize**](OauthApi.md#oauthauthorize) | **POST** /api/v1/oauth/authorize |  |
| [**oAuthToken**](OauthApi.md#oauthtoken) | **POST** /api/v1/oauth/token |  |



## oAuthAuthorize

> OAuthAuthorize200Response oAuthAuthorize(authorizeCodeRequest)



### Example

```ts
import {
  Configuration,
  OauthApi,
} from '';
import type { OAuthAuthorizeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OauthApi();

  const body = {
    // AuthorizeCodeRequest
    authorizeCodeRequest: ...,
  } satisfies OAuthAuthorizeRequest;

  try {
    const data = await api.oAuthAuthorize(body);
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
| **authorizeCodeRequest** | [AuthorizeCodeRequest](AuthorizeCodeRequest.md) |  | |

### Return type

[**OAuthAuthorize200Response**](OAuthAuthorize200Response.md)

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


## oAuthToken

> TokenResponse oAuthToken(tokenRequest)



### Example

```ts
import {
  Configuration,
  OauthApi,
} from '';
import type { OAuthTokenRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OauthApi();

  const body = {
    // TokenRequest
    tokenRequest: ...,
  } satisfies OAuthTokenRequest;

  try {
    const data = await api.oAuthToken(body);
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
| **tokenRequest** | [TokenRequest](TokenRequest.md) |  | |

### Return type

[**TokenResponse**](TokenResponse.md)

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

