



/*-------------------Super Admin-------------------*/
// create new comptition by super admin
router.post("/dashboard/comptitions", isAuthenticated, isAuthorized(["super_admin"]));

// get all comptitions by super admin active and inactive -> if there is any query string it will be for active comptitions only
// router.get("/comptitions?active", isAuthenticated, isAuthorized(["super_admin"])); -> return active comptitions only
// router.get("/comptitions?inactive", isAuthenticated, isAuthorized(["super_admin"])); -> return inactive comptitions only

/*
  1- comptition id
  1- comptition name
  1- category name (by category id)
  1- pricePer request
  1- maxSubscribers
  1- currentSubscribers -> count of subscribers from subscriptions schema by comptition id
  1- start_date
  1- end_date
  1- active or inactive (status)
 */
router.get("/dashboard/comptitions", isAuthenticated, isAuthorized(["super_admin"]));

// get comptition by id by super admin active and inactive
/*
    1- comptition id
    1- comptition name
    1- category name (by category id)
    1- pricePer request
    1- maxSubscribers
    1- currentSubscribers -> count of subscribers from subscriptions schema by comptition id
    1- start_date
    1- end_date
    1- active or inactive (status)
    1- all subscribers for this comptition (include user name, email, phone, wallet, status , counter , isBlocked/fraud)
 */
router.get(
  "/dashboard/comptitions/:comptitionId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);


// update comptition by id by super admin  -> name , description , start_date , end_date , price , max_subscribers , active , in_active , price_per_request
router.put(
  "/dashboard/comptitions/:comptitionId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);

/*-------------------optional-------------------*/
// optional route to delete comptition by id by super admin
// router.delete("/comptitions/:comptitionId", isAuthenticated, isAuthorized(["super_admin"]));





