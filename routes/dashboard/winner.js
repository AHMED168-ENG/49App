// make user winner route by super admin -> jsut only active comptitions
// check of subscriber's counter is equal to limitOfComptition
router.put(
  "/dashboard/winner/:subscriberId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);

// get all winners for whole comptitions by super admin
/*
    1- all winners (include name, email, phone, wallet, status , counter , isBlocked/fraud)
 */
router.get(
  "/dashboard/winners",
  isAuthenticated,
  isAuthorized(["super_admin"])
);

// get specific winner by id by super admin
/*
    1- name
    1- email
    1- phone
    1- wallet
    1- status
    1- counter
    1- isBlocked/fraud
    1- all comptitions that user won (include comptition name, category name, pricePer request, start_date, end_date, status)
 */
router.get(
  "/dashboard/winners/:winnerId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);
