// get all subscribers for whole competitions by super admin
/*
    1- all subscribers (include name, email, phone, wallet, status , counter , isBlocked/fraud)
 */
router.get(
  "/dashboard/subscribers",
  isAuthenticated,
  isAuthorized(["super_admin"])
);

// get specific subscriber by id by super admin
/*
        1- name
        1- email
        1- phone
        1- wallet
        1- status
        1- counter
        1- isBlocked/fraud
        1- all competitions that user subscribed to (include competitions name, category name, pricePer request, start_date, end_date, status)
     */
router.get(
  "/dashboard/subscribers/:subscriberId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);

// super admin can delete remove or block or fraud any user from the system by this route
router.put(
  "/dashboard/subscriptions/:subscriberId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);
