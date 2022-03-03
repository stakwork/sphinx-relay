| Item Desc   | Value                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint    | `/tribe_channel`                                                                                                                                                       |
| Type        | POST                                                                                                                                                                   |
| Description | This endpoint is used to create a new channel in a tribe/groupchat we call the tribes server to add a new channel to its db                                            |
| Request     | <pre>body: {</br> tribe_uuid: string</br> host: string</br> name: string</br>}</br>headers: {</br> authToken: string</br>}</pre>                                       |
| Response    | <pre>{</br> success: boolean</br> response: {</br> id: number</br> tribe_uuid: string</br> name: string</br> created: DateTime</br> deleted: boolean</br> }</br>}</br> |

| Item Desc   | Value                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint    | `/tribe_channel`                                                                                                                                |
| Type        | DELETE                                                                                                                                          |
| Description | This endpoint is used to delete a channel in a tribe/groupchat we call the tribes server to update a channel to set its deleted flag to be true |
| Request     | <pre>body: {</br> id: number</br> host: string</br>}</br>headers: {</br> authToken: string</br>}</pre>                                          |
| Response    | <pre>{</br> success: boolean</br> response: boolean</br>}</br>                                                                                  |
