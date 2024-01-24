import { getData, setData } from './dataStore';
import {
  isAuthUserGlobalOwner,
  isOnlyGlobalOwner,
  isPermissionIdValid,
  isUserOnlyGlobalOwner,
  isValidUser,
  tokenToUId,
  userHasPermission
} from './other';

export const adminUserRemoveV1 = (token: string, uId: number) => {
  isValidUser(tokenToUId(token) as number);
  isValidUser(uId);
  isOnlyGlobalOwner(uId);
  isAuthUserGlobalOwner(token);

  const data = getData();
  for (const user of data.users) {
    if (user.id === uId) {
      user.nameFirst = 'Removed';
      user.nameLast = 'user';
    }
  }
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    }
  }
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    }
  }
  setData(data);

  return {};
};

export const adminUserpermissionChangeV1 = (token: string, uId: number, permissionId: number) => {
  isValidUser(tokenToUId(token) as number);
  isValidUser(uId);
  isUserOnlyGlobalOwner(uId, permissionId);
  isPermissionIdValid(permissionId);
  userHasPermission(uId, permissionId);
  isAuthUserGlobalOwner(token);

  const data = getData();
  for (const user of data.users) {
    if (user.id === uId) {
      user.permission = permissionId;
    }
  }
  setData(data);

  return {};
};
