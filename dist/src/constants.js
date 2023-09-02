"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./utils/config");
const config = (0, config_1.loadConfig)();
const constants = {
    min_sat_amount: config.min_sat,
    final_cltv_delta: config.final_cltv_delta,
    invite_statuses: {
        pending: 0,
        ready: 1,
        delivered: 2,
        in_progress: 3,
        complete: 4,
        expired: 5,
        payment_pending: 6,
    },
    contact_statuses: {
        pending: 0,
        confirmed: 1,
    },
    statuses: {
        pending: 0,
        confirmed: 1,
        cancelled: 2,
        received: 3,
        failed: 4,
        deleted: 5,
    },
    chat_statuses: {
        approved: 0,
        pending: 1,
        rejected: 2,
    },
    message_types: {
        message: 0,
        confirmation: 1,
        invoice: 2,
        payment: 3,
        cancellation: 4,
        direct_payment: 5,
        attachment: 6,
        purchase: 7,
        purchase_accept: 8,
        purchase_deny: 9,
        contact_key: 10,
        contact_key_confirmation: 11,
        group_create: 12,
        group_invite: 13,
        group_join: 14,
        group_leave: 15,
        group_kick: 16,
        delete: 17,
        repayment: 18,
        member_request: 19,
        member_approve: 20,
        member_reject: 21,
        tribe_delete: 22,
        bot_install: 23,
        bot_cmd: 24,
        bot_res: 25,
        heartbeat: 26,
        heartbeat_confirmation: 27,
        keysend: 28,
        boost: 29,
        query: 30,
        query_response: 31,
        call: 32,
    },
    network_types: {
        lightning: 0,
        mqtt: 1,
        co_tenant: 2,
    },
    payment_errors: {
        timeout: 'Timed Out',
        no_route: 'No Route To Receiver',
        error: 'Error',
        incorrect_payment_details: 'Incorrect Payment Details',
        unknown: 'Unknown',
    },
    chat_types: {
        conversation: 0,
        group: 1,
        tribe: 2,
    },
    bot_types: {
        builtin: 0,
        local: 1,
        remote: 2,
    },
    chat_roles: {
        '-': 0,
        owner: 1,
        admin: 2,
        mod: 3,
        writer: 4,
        reader: 5,
    },
    notify_levels: {
        all: 0,
        mentions: 1,
        mute: 2,
    },
    lsat_statuses: {
        expired: 0,
        active: 1,
    },
    action_types: {
        message: 0,
        search: 1,
        boost: 2,
        podcast_clip_comment: 3,
        content_consumed: 4,
    },
    reward_types: {
        earned: 1,
        spent: 2,
        post: 3,
    },
    call_status: {
        new: 1,
        in_progress: 2,
        completed: 3,
        stored: 4,
        in_actve: 5,
        confirmed: 6,
    },
    badge_type: {
        liquid: 1,
    },
};
exports.default = constants;
//# sourceMappingURL=constants.js.map