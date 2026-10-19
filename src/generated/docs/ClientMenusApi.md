# ClientMenusApi

All URIs are relative to *https://api.example.com*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**clientMenusCreateSysMenu**](ClientMenusApi.md#clientmenuscreatesysmenu) | **POST** /api/v1/clients/{clientId}/menus |  |
| [**clientMenusDeleteSysMenu**](ClientMenusApi.md#clientmenusdeletesysmenu) | **DELETE** /api/v1/clients/{clientId}/menus/{menuId} |  |
| [**clientMenusGetSysMenu**](ClientMenusApi.md#clientmenusgetsysmenu) | **GET** /api/v1/clients/{clientId}/menus/{menuId} |  |
| [**clientMenusListSysMenus**](ClientMenusApi.md#clientmenuslistsysmenus) | **GET** /api/v1/clients/{clientId}/menus |  |
| [**clientMenusMoveSysMenu**](ClientMenusApi.md#clientmenusmovesysmenuoperation) | **PATCH** /api/v1/clients/{clientId}/menus/{menuId}/parent |  |
| [**clientMenusReorderSysMenus**](ClientMenusApi.md#clientmenusreordersysmenus) | **PUT** /api/v1/clients/{clientId}/menus/{menuId}/reorder |  |
| [**clientMenusUpdateSysMenu**](ClientMenusApi.md#clientmenusupdatesysmenu) | **PATCH** /api/v1/clients/{clientId}/menus/{menuId} |  |



## clientMenusCreateSysMenu

> SysMenu clientMenusCreateSysMenu(clientId, createSysMenuRequest)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusCreateSysMenuRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
    // CreateSysMenuRequest
    createSysMenuRequest: ...,
  } satisfies ClientMenusCreateSysMenuRequest;

  try {
    const data = await api.clientMenusCreateSysMenu(body);
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
| **createSysMenuRequest** | [CreateSysMenuRequest](CreateSysMenuRequest.md) |  | |

### Return type

[**SysMenu**](SysMenu.md)

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


## clientMenusDeleteSysMenu

> clientMenusDeleteSysMenu(clientId, menuId)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusDeleteSysMenuRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
    // string
    menuId: menuId_example,
  } satisfies ClientMenusDeleteSysMenuRequest;

  try {
    const data = await api.clientMenusDeleteSysMenu(body);
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
| **menuId** | `string` |  | [Defaults to `undefined`] |

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


## clientMenusGetSysMenu

> SysMenu clientMenusGetSysMenu(clientId, menuId)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusGetSysMenuRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
    // string
    menuId: menuId_example,
  } satisfies ClientMenusGetSysMenuRequest;

  try {
    const data = await api.clientMenusGetSysMenu(body);
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
| **menuId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**SysMenu**](SysMenu.md)

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


## clientMenusListSysMenus

> Array&lt;SysMenu&gt; clientMenusListSysMenus(clientId)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusListSysMenusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
  } satisfies ClientMenusListSysMenusRequest;

  try {
    const data = await api.clientMenusListSysMenus(body);
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

[**Array&lt;SysMenu&gt;**](SysMenu.md)

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


## clientMenusMoveSysMenu

> SysMenu clientMenusMoveSysMenu(clientId, menuId, clientMenusMoveSysMenuRequest)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusMoveSysMenuOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
    // string
    menuId: menuId_example,
    // ClientMenusMoveSysMenuRequest
    clientMenusMoveSysMenuRequest: ...,
  } satisfies ClientMenusMoveSysMenuOperationRequest;

  try {
    const data = await api.clientMenusMoveSysMenu(body);
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
| **menuId** | `string` |  | [Defaults to `undefined`] |
| **clientMenusMoveSysMenuRequest** | [ClientMenusMoveSysMenuRequest](ClientMenusMoveSysMenuRequest.md) |  | |

### Return type

[**SysMenu**](SysMenu.md)

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


## clientMenusReorderSysMenus

> Array&lt;SysMenu&gt; clientMenusReorderSysMenus(clientId, menuId, reorderSysMenuRequest)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusReorderSysMenusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
    // string
    menuId: menuId_example,
    // ReorderSysMenuRequest
    reorderSysMenuRequest: ...,
  } satisfies ClientMenusReorderSysMenusRequest;

  try {
    const data = await api.clientMenusReorderSysMenus(body);
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
| **menuId** | `string` |  | [Defaults to `undefined`] |
| **reorderSysMenuRequest** | [ReorderSysMenuRequest](ReorderSysMenuRequest.md) |  | |

### Return type

[**Array&lt;SysMenu&gt;**](SysMenu.md)

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


## clientMenusUpdateSysMenu

> SysMenu clientMenusUpdateSysMenu(clientId, menuId, updateSysMenuRequest)



### Example

```ts
import {
  Configuration,
  ClientMenusApi,
} from '';
import type { ClientMenusUpdateSysMenuRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClientMenusApi();

  const body = {
    // string
    clientId: clientId_example,
    // string
    menuId: menuId_example,
    // UpdateSysMenuRequest
    updateSysMenuRequest: ...,
  } satisfies ClientMenusUpdateSysMenuRequest;

  try {
    const data = await api.clientMenusUpdateSysMenu(body);
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
| **menuId** | `string` |  | [Defaults to `undefined`] |
| **updateSysMenuRequest** | [UpdateSysMenuRequest](UpdateSysMenuRequest.md) |  | |

### Return type

[**SysMenu**](SysMenu.md)

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

