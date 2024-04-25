// subscribe to comptition by user only to active comptitions
router.post(
  "/subscriber/comptitions/:comptitionsId",
  isAuthenticated,
  isAuthorized(["user"])
);

// get all comptitions that user subscribed to(only active comptitions)
/*
      1- comptition id
      1- comptition name
      1- category name (by category id)
      1- currentSubscribers
      1- start_date
      1- end_date
      1- pricePer request
   */
router.get("/subscriber/comptitions", isAuthenticated, isAuthorized(["user"]));

// get comptition by id that user subscribed to(only active comptitions)
/*
      1- comptition id
      1- comptition name
      1- category name (by category id)
      1- counter
      1- start_date
      1- end_date
      1- wallet
   */
router.get(
  "/subscriber/comptitions/:id",
  isAuthenticated,
  isAuthorized(["user"])
);

// delete subscription by user to comptition by id by user also delete user wallet for this comptition
router.delete(
  "/subscriptions/:comptitionId",
  isAuthenticated,
  isAuthorized(["user"])
);
