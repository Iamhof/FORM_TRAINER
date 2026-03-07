import { router } from "./create-context";
import { getAnalyticsProcedure } from "./routes/analytics/get/route";
import { getVolumeProcedure } from "./routes/analytics/get-volume/route";
import { syncAnalyticsProcedure } from "./routes/analytics/sync/route";
import { meProcedure } from "./routes/auth/me/route";
import { deleteBodyMetricProcedure } from "./routes/body-metrics/delete/route";
import { latestBodyMetricProcedure } from "./routes/body-metrics/latest/route";
import { listBodyMetricsProcedure } from "./routes/body-metrics/list/route";
import { logBodyMetricProcedure } from "./routes/body-metrics/log/route";
import { getMyPTProcedure } from "./routes/clients/get-my-pt/route";
import { listSharedProgrammesProcedure } from "./routes/clients/list-shared-programmes/route";
import { hiProcedure } from "./routes/example/hi/route";
import { checkAndRecordPRProcedure } from "./routes/personal-records/check-and-record/route";
import { listPersonalRecordsProcedure } from "./routes/personal-records/list/route";
import { updateProfileProcedure } from "./routes/profile/update/route";
import { updateColorProcedure } from "./routes/profile/update-color/route";
import { createProgrammeProcedure } from "./routes/programmes/create/route";
import { deleteProgrammeProcedure } from "./routes/programmes/delete/route";
import { getProgrammeProcedure } from "./routes/programmes/get/route";
import { listProgrammesProcedure } from "./routes/programmes/list/route";
import { acceptInvitationProcedure } from "./routes/pt/accept-invitation/route";
import { getClientAnalyticsProcedure } from "./routes/pt/get-client-analytics/route";
import { getClientWorkoutsProcedure } from "./routes/pt/get-client-workouts/route";
import { inviteClientProcedure } from "./routes/pt/invite-client/route";
import { listClientsProcedure } from "./routes/pt/list-clients/route";
import { listInvitationsProcedure } from "./routes/pt/list-invitations/route";
import { removeClientProcedure } from "./routes/pt/remove-client/route";
import { shareProgrammeProcedure } from "./routes/pt/share-programme/route";
import { unshareProgrammeProcedure } from "./routes/pt/unshare-programme/route";
import { assignSessionProcedure } from "./routes/schedules/assign-session/route";
import { getScheduleProcedure } from "./routes/schedules/get/route";
import { updateScheduleProcedure } from "./routes/schedules/update/route";
import { workoutHistoryProcedure } from "./routes/workouts/history/route";
import { logWorkoutProcedure } from "./routes/workouts/log/route";

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  auth: router({
    me: meProcedure,
  }),
  programmes: router({
    create: createProgrammeProcedure,
    list: listProgrammesProcedure,
    get: getProgrammeProcedure,
    delete: deleteProgrammeProcedure,
  }),
  workouts: router({
    log: logWorkoutProcedure,
    history: workoutHistoryProcedure,
  }),
  analytics: router({
    get: getAnalyticsProcedure,
    sync: syncAnalyticsProcedure,
    getVolume: getVolumeProcedure,
  }),
  pt: router({
    inviteClient: inviteClientProcedure,
    acceptInvitation: acceptInvitationProcedure,
    listInvitations: listInvitationsProcedure,
    listClients: listClientsProcedure,
    removeClient: removeClientProcedure,
    shareProgramme: shareProgrammeProcedure,
    unshareProgramme: unshareProgrammeProcedure,
    getClientAnalytics: getClientAnalyticsProcedure,
    getClientWorkouts: getClientWorkoutsProcedure,
  }),
  clients: router({
    getMyPT: getMyPTProcedure,
    listSharedProgrammes: listSharedProgrammesProcedure,
  }),
  schedules: router({
    get: getScheduleProcedure,
    update: updateScheduleProcedure,
    assignSession: assignSessionProcedure,
  }),
  profile: router({
    updateColor: updateColorProcedure,
    update: updateProfileProcedure,
  }),
  bodyMetrics: router({
    log: logBodyMetricProcedure,
    list: listBodyMetricsProcedure,
    latest: latestBodyMetricProcedure,
    delete: deleteBodyMetricProcedure,
  }),
  personalRecords: router({
    list: listPersonalRecordsProcedure,
    checkAndRecord: checkAndRecordPRProcedure,
  }),
});

export type AppRouter = typeof appRouter;
