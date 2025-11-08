import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { meProcedure } from "./routes/auth/me/route";
import { createProgrammeProcedure } from "./routes/programmes/create/route";
import { listProgrammesProcedure } from "./routes/programmes/list/route";
import { getProgrammeProcedure } from "./routes/programmes/get/route";
import { deleteProgrammeProcedure } from "./routes/programmes/delete/route";
import { logWorkoutProcedure } from "./routes/workouts/log/route";
import { getWorkoutHistoryProcedure } from "./routes/workouts/history/route";
import { getAnalyticsProcedure } from "./routes/analytics/get/route";
import { syncAnalyticsProcedure } from "./routes/analytics/sync/route";
import { getVolumeProcedure } from "./routes/analytics/get-volume/route";
import { inviteClientProcedure } from "./routes/pt/invite-client/route";
import { acceptInvitationProcedure } from "./routes/pt/accept-invitation/route";
import { listInvitationsProcedure } from "./routes/pt/list-invitations/route";
import { listClientsProcedure } from "./routes/pt/list-clients/route";
import { removeClientProcedure } from "./routes/pt/remove-client/route";
import { shareProgrammeProcedure } from "./routes/pt/share-programme/route";
import { unshareProgrammeProcedure } from "./routes/pt/unshare-programme/route";
import { getClientAnalyticsProcedure } from "./routes/pt/get-client-analytics/route";
import { getClientWorkoutsProcedure } from "./routes/pt/get-client-workouts/route";
import { getMyPTProcedure } from "./routes/clients/get-my-pt/route";
import { listSharedProgrammesProcedure } from "./routes/clients/list-shared-programmes/route";
import { logBodyMetricsProcedure } from "./routes/body-metrics/log/route";
import { listBodyMetricsProcedure } from "./routes/body-metrics/list/route";
import { getLatestBodyMetricsProcedure } from "./routes/body-metrics/latest/route";
import { deleteBodyMetricsProcedure } from "./routes/body-metrics/delete/route";
import { listPersonalRecordsProcedure } from "./routes/personal-records/list/route";
import { checkAndRecordPRProcedure } from "./routes/personal-records/check-and-record/route";
import { getScheduleProcedure } from "./routes/schedules/get/route";
import { updateScheduleProcedure } from "./routes/schedules/update/route";
import { assignSessionProcedure } from "./routes/schedules/assign-session/route";
import { updateColorProcedure } from "./routes/profile/update-color/route";
import { updateProfileProcedure } from "./routes/profile/update/route";
import { updateLeaderboardProfileProcedure } from "./routes/leaderboard/update-profile/route";
import { getLeaderboardProfileProcedure } from "./routes/leaderboard/get-profile/route";
import { getLeaderboardRankingsProcedure } from "./routes/leaderboard/get-rankings/route";
import { getMyRankProcedure } from "./routes/leaderboard/get-my-rank/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    me: meProcedure,
  }),
  programmes: createTRPCRouter({
    create: createProgrammeProcedure,
    list: listProgrammesProcedure,
    get: getProgrammeProcedure,
    delete: deleteProgrammeProcedure,
  }),
  workouts: createTRPCRouter({
    log: logWorkoutProcedure,
    history: getWorkoutHistoryProcedure,
  }),
  analytics: createTRPCRouter({
    get: getAnalyticsProcedure,
    sync: syncAnalyticsProcedure,
    getVolume: getVolumeProcedure,
  }),
  pt: createTRPCRouter({
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
  clients: createTRPCRouter({
    getMyPT: getMyPTProcedure,
    listSharedProgrammes: listSharedProgrammesProcedure,
  }),
  bodyMetrics: createTRPCRouter({
    log: logBodyMetricsProcedure,
    list: listBodyMetricsProcedure,
    latest: getLatestBodyMetricsProcedure,
    delete: deleteBodyMetricsProcedure,
  }),
  personalRecords: createTRPCRouter({
    list: listPersonalRecordsProcedure,
    checkAndRecord: checkAndRecordPRProcedure,
  }),
  schedules: createTRPCRouter({
    get: getScheduleProcedure,
    update: updateScheduleProcedure,
    assignSession: assignSessionProcedure,
  }),
  profile: createTRPCRouter({
    updateColor: updateColorProcedure,
    update: updateProfileProcedure,
  }),
  leaderboard: createTRPCRouter({
    updateProfile: updateLeaderboardProfileProcedure,
    getProfile: getLeaderboardProfileProcedure,
    getRankings: getLeaderboardRankingsProcedure,
    getMyRank: getMyRankProcedure,
  }),
});

export type AppRouter = typeof appRouter;
