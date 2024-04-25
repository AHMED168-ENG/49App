// update wallet by super admin (can incerement or discerement mony) -> jsut only active comptitions
router.put(
  "/dashboard/wallet/:subscriberId",
  isAuthenticated,
  isAuthorized(["super_admin"])
);
