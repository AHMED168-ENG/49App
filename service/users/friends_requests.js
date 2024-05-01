const checkIfFriendRequestExistService = async (userId, friendId) => {};

const getFriendRequestsService = async () => {
  // --> 1) get friend requests
  // --> 2) return friend requests
};

const getFriendRequestService = async (userId) => {
  // --> 1) check if friend request exist, return error not found
  const isFriendRequestExist = await checkIfFriendRequestExistService(
    userId,
    friendId
  );

  if (isFriendRequestExist) {
    //
  }

  // --> 2) get friend request
};

const sendFriendRequestService = async (friendId) => {
  // --> 1) check if friend exist, return error not found

  // --> 2) check if friend request exist, return error conflict
  const isFriendRequestExist = await checkIfFriendRequestExistService(
    userId,
    friendId
  );

  if (isFriendRequestExist) {
    //
  }

  // --> 3) check if the friend allows sending friend requests, return error forbidden
  const isFriendAllowSendingFriendRequest = true;

  if (!isFriendAllowSendingFriendRequest) {
    //
  }

  // --> 3) send friend request
};

const deleteRequestService = async (userId) => {
  // --> 1) check if friend request exist, return error conflict
  const isFriendRequestExist = await checkIfFriendRequestExistService(
    userId,
    friendId
  );

  if (isFriendRequestExist) {
    //
  }

  // --> 2) delete friend request
};

export {
  checkIfFriendRequestExistService,
  getFriendRequestsService,
  getFriendRequestService,
  sendFriendRequestService,
  deleteRequestService,
};
