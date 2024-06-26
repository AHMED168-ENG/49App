import auth from "./auth.js";
import profile from "./user_profile.js";
import ads from "./ad.js";
import favorites from "./favorite.js";
import notifications from "./notification.js";
import cashBack from "./cash_back.js";
import subscriptions from "./subscription.js";
import payment from "./payment.js";
import addressRoute from "./address.js";
import report from "./social/report.js";
import search from "./social/search.js";
import peerProfile from "./social/peer_profile.js";
import hiddenOpinion from "./social/hidden_opinion.js";
import list from "./social/list.js";
import tinder from "./social/tinder.js";
import gift from "./social/gift.js";
import reel from "./social/reel.js";
import posts from "./social/post.js";
import chat from "./social/chat.js";
import ride from "./services/ride.js";
import loading from "./services/loading.js";
import food from "./services/food.js";
import health from "./services/health.js";
import categories from "./categories.js";
import appRadio from "./app_radio.js";
import payout from "./payout.js";
import contests from "./contests.js";
import dashboardAuth from "./dashboard/auth.js";
import dashboardSuperAdmin from "./dashboard/super_admin.js";
import competitionRouter from "./dashboard/competition.js";
import dashboardAdmin from "./dashboard/admin.js";

import dashboardSubscribersRouter from "./dashboard/subscriber.js";

import competition_subscriber from "./competition_subscriber.js";
import dashboardWinner from "./dashboard/winner.js";
import manual_payment from "./manual_payment.js";
import auction from "./auction.js";
import installments from "./installments.js";

import wheelItems from "./wheel/wheel_items.js";
import wheel from "./wheel/wheel.js";
import wheelWallet from "./wheel/wheel_wallet.js"
import wheelWinner from "./dashboard/wheel_winner.js"

const initializeRoutes = (app) => {
  app.use("/auth", auth);
  app.use("/profile", profile);
  app.use("/ads", ads);
  app.use("/favorites", favorites);
  app.use("/notifications", notifications);
  app.use("/cash-back", cashBack);
  app.use("/subscriptions", subscriptions);
  app.use("/payment", payment);
  app.use('/manual-payment', manual_payment);
  app.use("/address", addressRoute);

  app.use("/social/report", report);
  app.use("/social/search", search);
  app.use("/social/profile", peerProfile);
  app.use("/social/hidden-opinions", hiddenOpinion);
  app.use("/social/lists", list);
  app.use("/social/tinder", tinder);
  app.use("/social/gift", gift);
  app.use("/social/posts", posts);
  //app.use('/social/reels', reel);
  app.use("/social/chat", chat);

  app.use("/services/ride", ride);
  app.use("/services/loading", loading);
  app.use("/services/food", food);
  app.use("/services/health", health);
  app.use("/auction", auction);
  app.use("/installments", installments);

  app.use("/categories", categories);
  app.use("/app-radio", appRadio);
  app.use("/payout", payout);
  app.use("/contests", contests);

  app.use("/dashboard/auth", dashboardAuth);
  app.use("/dashboard/super-admin", dashboardSuperAdmin);
  app.use("/dashboard/winner", dashboardWinner);
  app.use("/dashboard/admin", dashboardAdmin);

  app.use("/dashboard", dashboardSubscribersRouter);

  app.use("/subscriber", competition_subscriber);
  // nested routes
  app.use("/dashboard/super-admin/competitions", competitionRouter);

  app.use("/wheels", wheelItems);
  app.use("/wheels", wheelWallet)
  app.use("/wheels", wheel);
  app.use("/dashboard/winner", wheelWinner)
};

export { initializeRoutes };
