const isAuthorized = (roles) => {
  return async (req, res, next) => {
    try {
      // --> 1) get user role from local request
      const { role } = req.user;

      // --> 2) check if the user is allowed to go through this route
      if (!roles.includes(role)) {
        return next(new Error("You are not allowed to visit this route"));
      }

      // --> 3) next
      next();
    } catch (error) {
      next(error);
    }
  };
};

export { isAuthorized };
