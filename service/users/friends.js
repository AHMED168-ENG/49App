const checkIfFriendExistService = async (userId, friendId) => {};

const getFriendsService = async () => {};

const getFriendService = async (friendId) => {
  // --> 1) check if friend exist, return error not found
  const isFriendExist = await checkIfFriendExistService(userId, friendId);

  if (isFriendExist) {
    //
  }
};

const acceptFriendRequestService = async (friendId) => {};

const deleteFriendService = async (friendId) => {};

export {
  checkIfFriendExistService,
  getFriendsService,
  getFriendService,
  acceptFriendRequestService,
  deleteFriendService,
};
