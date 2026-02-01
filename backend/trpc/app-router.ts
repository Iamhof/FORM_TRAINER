import { createTRPCRouter } from "./create-context.js";
import hiRoute from "./routes/example/hi/route.js";
import { meProcedure } from "./routes/auth/me/route.js";
import { listExercisesProcedure } from "./routes/exercises/list/route.js";
import { createProgrammeProcedure } from "./routes/programmes/create/route.js";
import { listProgrammesProcedure } from "./routes/programmes/list/route.js";
import { getProgrammeProcedure } from "./routes/programmes/get/route.js";
import { deleteProgrammeProcedure } from "./routes/programmes/delete/route.js";
import { logWorkoutProcedure } from "./routes/workouts/log/route.js";
import { getWorkoutHistoryProcedure } from "./routes/workouts/history/route.js";
import { getAnalyticsProcedure } from "./routes/analytics/get/route.js";
import { syncAnalyticsProcedure } from "./routes/analytics/sync/route.js";
import { getVolumeProcedure } from "./routes/analytics/get-volume/route.js";
import { getAnalyticsOverviewProcedure } from "./routes/analytics/overview/route.js";
import { inviteClientProcedure } from "./routes/pt/invite-client/route.js";
import { acceptInvitationProcedure } from "./routes/pt/accept-invitation/route.js";
import { listInvitationsProcedure } from "./routes/pt/list-invitations/route.js";
import { listClientsProcedure } from "./routes/pt/list-clients/route.js";
import { removeClientProcedure } from "./routes/pt/remove-client/route.js";
import { shareProgrammeProcedure } from "./routes/pt/share-programme/route.js";
import { unshareProgrammeProcedure } from "./routes/pt/unshare-programme/route.js";
import { resendInvitationProcedure } from "./routes/pt/resend-invitation/route.js";
import { cancelInvitationProcedure } from "./routes/pt/cancel-invitation/route.js";
import { getClientAnalyticsProcedure } from "./routes/pt/get-client-analytics/route.js";
import { getClientWorkoutsProcedure } from "./routes/pt/get-client-workouts/route.js";
import { getMyPTProcedure } from "./routes/clients/get-my-pt/route.js";
import { listSharedProgrammesProcedure } from "./routes/clients/list-shared-programmes/route.js";
import { logBodyMetricsProcedure } from "./routes/body-metrics/log/route.js";
import { listBodyMetricsProcedure } from "./routes/body-metrics/list/route.js";
import { getLatestBodyMetricsProcedure } from "./routes/body-metrics/latest/route.js";
import { deleteBodyMetricsProcedure } from "./routes/body-metrics/delete/route.js";
import { listPersonalRecordsProcedure } from "./routes/personal-records/list/route.js";
import { checkAndRecordPRProcedure } from "./routes/personal-records/check-and-record/route.js";
import { getScheduleProcedure } from "./routes/schedules/get/route.js";
import { updateScheduleProcedure } from "./routes/schedules/update/route.js";
import { assignSessionProcedure } from "./routes/schedules/assign-session/route.js";
import { toggleScheduleDayProcedure } from "./routes/schedules/toggle-day/route.js";
import { updateColorProcedure } from "./routes/profile/update-color/route.js";
import { updateProfileProcedure } from "./routes/profile/update/route.js";
import { updateLeaderboardProfileProcedure } from "./routes/leaderboard/update-profile/route.js";
import { getLeaderboardProfileProcedure } from "./routes/leaderboard/get-profile/route.js";
import { getLeaderboardRankingsProcedure } from "./routes/leaderboard/get-rankings/route.js";
import { getMyRankProcedure } from "./routes/leaderboard/get-my-rank/route.js";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    me: meProcedure,
  }),
  exercises: createTRPCRouter({
    list: listExercisesProcedure,
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
    overview: getAnalyticsOverviewProcedure,
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
    resendInvitation: resendInvitationProcedure,
    cancelInvitation: cancelInvitationProcedure,
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
    toggleDay: toggleScheduleDayProcedure,
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
