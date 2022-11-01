"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("../../utils/json");
describe('tests for src/utils/json.ts', () => {
    const currentTime = new Date('2022-08-22T17:49:42.727Z').toISOString();
    const message = {
        id: 0,
        uuid: '0',
        chatId: 0,
        type: 0,
        sender: 0,
        receiver: 0,
        amount: 0,
        amountMsat: 0,
        paymentHash: '',
        paymentRequest: '',
        date: currentTime,
        expirationDate: currentTime,
        messageContent: '',
        remoteMessageContent: '',
        status: 0,
        statusMap: '',
        parentId: 0,
        subscriptionId: 0,
        mediaKey: '',
        mediaType: '',
        mediaToken: '',
        seen: false,
        createdAt: currentTime,
        updatedAt: currentTime,
        senderAlias: '',
        senderPic: '',
        originalMuid: '',
        replyUuid: '',
        network_type: 0,
        tenant: 0,
        recipientAlias: '',
        recipientPic: '',
        forwardedSats: false,
    };
    const messageConvertedToJson = {
        amount: 0,
        amount_msat: 0,
        chat: null,
        chat_id: 0,
        contact: null,
        created_at: currentTime,
        date: currentTime,
        expiration_date: currentTime,
        forwarded_sats: false,
        id: 0,
        media_key: '',
        media_token: '',
        media_type: '',
        message_content: '',
        network_type: 0,
        original_muid: '',
        parent_id: 0,
        payment_hash: '',
        payment_request: '',
        receiver: 0,
        recipient_alias: '',
        recipient_pic: '',
        remote_message_content: '',
        reply_uuid: '',
        seen: 0,
        sender: 0,
        sender_alias: '',
        sender_pic: '',
        status: 0,
        status_map: null,
        subscription_id: 0,
        tenant: 0,
        type: 0,
        updated_at: currentTime,
        uuid: '0',
    };
    test('sendContactKeys', () => {
        const messageInJson = json_1.messageToJson(message);
        expect(messageInJson).toStrictEqual(messageConvertedToJson);
    });
});
//# sourceMappingURL=json.test.js.map