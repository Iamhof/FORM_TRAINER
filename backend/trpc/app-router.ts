import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { signupProcedure } from "./routes/auth/signup/route";
import { signinProcedure } from "./routes/auth/signin/route";
import { meProcedure } from "./routes/auth/me/route";
import { createProgrammeProcedure } from "./routes/programmes/create/route";
import { listProgrammesProcedure } from "./routes/programmes/list/route";
import { getProgrammeProcedure } from "./routes/programmes/get/route";
import { deleteProgrammeProcedure } from "./routes/programmes/delete/route";
import { logWorkoutProcedure } from "./routes/workouts/log/route";
import { getWorkoutHistoryProcedure } from "./routes/workouts/history/route";
import { getAnalyticsProcedure } from "./routes/analytics/get/route";
import { syncAnalyticsProcedure } from "./routes/analytics/sync/route";
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

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    signup: signupProcedure,
    signin: signinProcedure,
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
});

export type AppRouter = typeof appRouter;
