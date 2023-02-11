"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToStakwork = exports.initializeCronJobsForCallRecordings = exports.saveRecurringCall = void 0;
const models_1 = require("../../models");
const utils_1 = require("../../tests/utils");
const logger_1 = require("../../utils/logger");
const cron_1 = require("cron");
const node_fetch_1 = require("node-fetch");
const constants_1 = require("../../constants");
function saveRecurringCall({ link, title, description, tribe, tenant, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tribe.callRecording ||
            !tribe.jitsiServer ||
            !tribe.memeServerLocation ||
            !tribe.stakworkApiKey ||
            !tribe.stakworkWebhook ||
            tribe.jitsiServer !== validateJitsiServer(link, tribe.jitsiServer)) {
            return {
                status: false,
                errMsg: 'Please configure tribe for call recording',
            };
        }
        const recurringCall = (yield models_1.models.RecurringCall.create({
            link: link.split('#')[0],
            title,
            description,
            chatId: tribe.id,
            tenant,
            deleted: false,
        }));
        startCallRecordingCronJob(recurringCall);
        return { status: true };
    });
}
exports.saveRecurringCall = saveRecurringCall;
const validateJitsiServer = (link, tribeJitsi) => {
    return link.substring(0, tribeJitsi.length);
};
// store all current running jobs in memory
const jobs = {};
// init jobs from DB
const initializeCronJobsForCallRecordings = () => __awaiter(void 0, void 0, void 0, function* () {
    yield utils_1.helpers.sleep(1000);
    const calls = yield getAllCallRecording({ where: { deleted: false } });
    calls.length &&
        calls.forEach((call) => {
            logger_1.sphinxLogger.info([
                '=> starting call recording cron job',
                call.id + ':',
                call.title,
            ]);
            startCallRecordingCronJob(call);
        });
});
exports.initializeCronJobsForCallRecordings = initializeCronJobsForCallRecordings;
function startCallRecordingCronJob(call) {
    return __awaiter(this, void 0, void 0, function* () {
        jobs[call.id] = new cron_1.CronJob('0 27 * * * *', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const recurringCall = (yield models_1.models.RecurringCall.findOne({
                    where: { id: call.id },
                }));
                if (!recurringCall) {
                    delete jobs[call.id];
                    return this.stop();
                }
                logger_1.sphinxLogger.info(['EXEC CRON =>', recurringCall.id]);
                const tribe = (yield models_1.models.Chat.findOne({
                    where: { id: recurringCall.chatId },
                }));
                const filename = extractFileName(recurringCall.link, tribe.jitsiServer);
                const filepath = formFilenameAndPath(filename, tribe.memeServerLocation);
                const newCall = yield (0, node_fetch_1.default)(filepath, {
                    method: 'HEAD',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!newCall.ok) {
                    console.log('+++++++++++ No file found yet for', filename);
                    return;
                }
                const callVersionId = newCall.headers.raw()['x-amz-version-id'][0];
                if (recurringCall.currentVersionId === callVersionId) {
                    return;
                }
                yield recurringCall.update({ currentVersionId: callVersionId });
                const stakwork = yield sendToStakwork(tribe.stakworkApiKey, `${filename}_${callVersionId}`, `${filepath}?versionId=${callVersionId}`, tribe.stakworkWebhook, tribe.ownerPubkey, filename, tribe.name);
                const owner = (yield models_1.models.Contact.findOne({
                    where: { tenant: recurringCall.tenant, isOwner: true },
                }));
                const createdBy = {
                    id: owner.id,
                    nickname: owner.alias,
                    role: owner.isAdmin ? 'Admin' : 'Member',
                };
                const callRecording = {
                    recordingId: filename,
                    chatId: tribe.id,
                    fileName: `${filename}.mp4`,
                    createdBy: JSON.stringify(createdBy),
                    versionId: callVersionId,
                };
                if (!stakwork.ok) {
                    console.log('++++++ Did not save on stakwork');
                    callRecording.status = constants_1.default.call_status.in_actve;
                    //Logs
                    logger_1.sphinxLogger.error([
                        'ERROR STORING FILE ON STARKWORK FOR RECURRING CALL WITH VERSION_ID',
                        callVersionId,
                    ]);
                }
                else {
                    const res = yield stakwork.json();
                    callRecording.status = constants_1.default.call_status.stored;
                    callRecording.stakworkProjectId = res.data.project_id;
                    //Logs
                    logger_1.sphinxLogger.info([
                        'RECURRING CALL STORED SUCCESSFULLY ON STAKWORK WITH VERSION_ID',
                        callVersionId,
                    ]);
                }
                yield models_1.models.CallRecording.create(callRecording);
            });
        }, null, true);
    });
}
function getAllCallRecording(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = Object.assign({ order: [['id', 'asc']] }, opts);
        try {
            const calls = (yield models_1.models.RecurringCall.findAll(options));
            return calls;
        }
        catch (error) {
            logger_1.sphinxLogger.error(['ERROR GETTING ALL RECURRING CALLS CRON =>', error]);
            return [];
        }
    });
}
function extractFileName(link, jitsiServer) {
    let filename = link.substring(jitsiServer.length, link.length);
    if (filename[0] === '/') {
        filename = filename.substring(1, filename.length);
    }
    return filename;
}
function formFilenameAndPath(filename, S3_BUCKET_URL) {
    if (S3_BUCKET_URL[S3_BUCKET_URL.length - 1] !== '/') {
        filename = `/${filename}`;
    }
    return `${S3_BUCKET_URL}${filename}.mp4`;
}
function sendToStakwork(apikey, callId, filePathAndName, webhook, ownerPubkey, filename, tribeName) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateInUTC = new Date(Date.now()).toUTCString();
        const dateInUnix = new Date(Date.now()).getTime() / 1000;
        return yield (0, node_fetch_1.default)(`https://jobs.stakwork.com/api/v1/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token token="${apikey}"`,
            },
            body: JSON.stringify({
                name: `${callId} file`,
                workflow_id: 5579,
                workflow_params: {
                    set_var: {
                        attributes: {
                            vars: {
                                media_url: filePathAndName,
                                episode_title: `Jitsi Call on ${dateInUTC}`,
                                clip_description: 'My Clip Description',
                                publish_date: `${dateInUnix}`,
                                episode_image: 'https://stakwork-uploads.s3.amazonaws.com/knowledge-graph-joe/jitsi.png',
                                show_img_url: 'https://stakwork-uploads.s3.amazonaws.com/knowledge-graph-joe/sphinx-logo.png',
                                webhook_url: `${webhook}`,
                                pubkey: ownerPubkey,
                                unique_id: filename.slice(0, -4),
                                clip_length: 60,
                                show_title: `${tribeName}`,
                            },
                        },
                    },
                },
            }),
        });
    });
}
exports.sendToStakwork = sendToStakwork;
//# sourceMappingURL=callRecording.js.map