// dm.ts
// Implements direct messaging features
import { getData, setData } from './dataStore';
import { getUNIXTime } from './other';
import {
  Data, dmData, dmDetailType, dmIdType, dmListType,
  dmMessages, emptyType, errorType, member, userData
} from './types';

// Creates a new dm
// Arguments:
//     <authUserId> (number)    - user id
//     <uIds> (number[])    - ids of people to add
// Return Value:
//     Returns { error: ... } if any values are invalid
//     Returns { dmId: number } if successful
const dmCreateV1 = (authUserId: number, uIds: number[]): dmIdType | errorType => {
  const timeStamp = getUNIXTime();
  const data: Data = getData();
  const users: userData[] = data.userData;
  const dms: dmData[] = data.dmData;
  const memberHandles: string[] = [];
  let dmName: string;

  // Get details of user creating dm
  const ownerUser = users.find(user => user.uId === authUserId);

  memberHandles.push(ownerUser.handleStr);

  const owner: member = {
    uId: authUserId,
    handleStr: ownerUser.handleStr,
    nameFirst: ownerUser.nameFirst,
    nameLast: ownerUser.nameLast,
    email: ownerUser.email
  };

  // Initialise new dm
  const newDm: dmData = {
    name: undefined,
    dmId: dms.length + 1,
    ownerMember: owner,
    members: [owner],
    messages: []
  };

  // Check uIds
  // Assumes that authUserId and the user calling the function is valid
  for (const uId of uIds) {
    // Validity check
    const user = users.find(user => user.uId === uId);
    if (user === undefined) return { error: 'Invalid user(s)' };

    // Add to memberHandles for sorting
    memberHandles.push(user.handleStr);

    // Duplicate check
    let instances = 0;
    uIds.forEach(uId2 => {
      if (uId === uId2) {
        instances++;
      }
    });
    if (instances !== 1) return { error: 'Duplicate uIds' };

    // If valid add to members
    const newMember: member = {
      uId: uId,
      handleStr: user.handleStr,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      email: user.email
    };
    newDm.members.push(newMember);
  }

  // Sort member handles - ascending by default
  memberHandles.sort();

  // Concatenate to string
  dmName = memberHandles[0];
  for (let i = 1; i < memberHandles.length; i++) {
    dmName += ', ';
    dmName += memberHandles[i];
  }
  newDm.name = dmName;

  // Add dm to data
  dms.push(newDm);
  uIds = [authUserId, ...uIds];
  for (const uId of uIds) {
    for (const user of data.userData) {
      if (user.uId === uId) {
        const obj = {
          numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined + 1,
          timeStamp: timeStamp,
        };
        user.userStats.dmsJoined.push(obj);
      }
    }
  }
  setData(data);

  return { dmId: newDm.dmId };
};

// Provides an array of dms the specified user is in
// Arguments:
//     <authUserId> (number)    - user id
// Return Value:
//     Returns an array of { dmId: number, name: string }
const dmListV1 = (authUserId: number): object => {
  const data: Data = getData();
  const dms: dmData[] = data.dmData;
  const dmList: dmListType[] = [];

  dms.forEach((dm: dmData) => {
    dm.members.forEach((member: member) => {
      if (member.uId === authUserId) {
        dmList.push({
          dmId: dm.dmId,
          name: dm.name
        });
      }
    });
  });

  return { dms: dmList };
};

// Displays basic info about the specified dm
// Arguments:
//     <authUserId> (number)    - user id
//     <dmId> (number)    - id of dm to view
// Return Value:
//     Returns { error: ... } if values are invalid
//     Returns { name: string, members: member[] } if successful
// Assumptions:
//   - authUserId is valid (token is validated in wrapper func)
const dmDetailsV1 = (authUserId: number, dmId: number): dmDetailType | errorType => {
  const data: Data = getData();
  const dms: dmData[] = data.dmData;

  // Get relevant dm and check that dmId is valid
  const dm = dms.find(dm => dm.dmId === dmId);
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Check member is in dm
  const memberIndex = dm.members.findIndex(member => member.uId === authUserId);
  if (memberIndex < 0) return { error: 'User is not a dm member' };

  return {
    name: dm.name,
    members: dm.members
  };
};

// Displays up to 50 messages from the specified dm
// Arguments:
//     <authUserId> (number)  - user id
//     <dmId> (number)        - id of dm to view
//     <start> (number)       - index of first message to display
// Return Value:
//     Returns { error: ... } if:
//        - values are invalid,
//        - user isn't in dm or,
//        - start > messages in channel
//     Returns { messages message[], start: number, end: number } if successful
// Assumptions:
//   - authUserId is valid (token is validated in wrapper func)
const dmMessagesV1 = (authUserId: number, dmId: number, start: number): dmMessages | errorType => {
  const data: Data = getData();
  const dms: dmData[] = data.dmData;

  // settings
  const DISPLAYED_ALL_MESSAGES = -1;
  const DISPLAY_COUNT = 50;

  let limit = start + DISPLAY_COUNT;
  let end = start + DISPLAY_COUNT;

  // Get relevant dm and check that dmId is valid
  const dm = dms.find(dm => dm.dmId === dmId);
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Make sure start is valid
  if (start >= dm.messages.length) return { error: 'Start is greater than number of messages in dm' };

  // Limit end to end of messages
  if (limit > dm.messages.length) {
    limit = dm.messages.length;
    end = DISPLAYED_ALL_MESSAGES;
  }

  // Check member is in dm
  const memberIndex = dm.members.findIndex((member: member) => member.uId === authUserId);
  if (memberIndex < 0) return { error: 'User is not a dm member' };

  // Populate return object
  const dmMessages: dmMessages = {
    messages: [],
    start: start,
    end: end
  };
  for (let i = start; i < limit; i++) {
    dmMessages.messages.push(dm.messages[i]);
  }

  return dmMessages;
};

// Removes the user from a dm
// Arguments:
//     <authUserId> (number)    - user id
//     <dmId> (number)          - id of dm to view
// Return Value:
//     Returns { error: ... } if dmId is invalid or the user is not a dm member
//     Returns { } if successful
// Assumptions:
//   - authUserId is valid (token is validated in wrapper func)
const dmLeaveV1 = (authUserId: number, dmId: number): emptyType | errorType => {
  const timeStamp = getUNIXTime();
  const data = getData();

  // Get dm and check that it exists
  const dm = data.dmData.find(dm => dm.dmId === dmId);
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Check user is a member of dm
  const memberIndex = dm.members.findIndex(member => member.uId === authUserId);
  if (memberIndex < 0) return { error: 'User is not a dm member' };

  // Remove user from dm
  dm.members.splice(memberIndex, 1);

  // Sets owner to undefined if owner leaves
  if (dm.ownerMember.uId === dmId) dm.ownerMember = undefined;

  for (const user of data.userData) {
    if (user.uId === authUserId) {
      const obj = {
        numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined - 1,
        timeStamp: timeStamp,
      };
      user.userStats.dmsJoined.push(obj);
    }
  }
  setData(data);
  return {};
};

// dm/remove/v1
//
// Function removes an existing DM, so all members are no longer in the DM
//
// @param {string} token = token storing authUser's session
// @param {numer} dmId = DM to remove
// @return {error:"error"} = if any of below errors occur
// @return {} = if no error
function dmRemoveV1(authUserId: number, dmId: number) {
  const timeStamp = getUNIXTime();
  const data = getData();
  const dm = data.dmData.find(dm => dm.dmId === dmId);

  // Return error if dmId not valid
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Return error if valid dmId but authUser is not the original DM creator
  if (dm.ownerMember === undefined || authUserId !== dm.ownerMember.uId) {
    return { error: 'User is not the original DM creator' };
  }
  // Return error if authUser no longer in the DM
  if (dm.members.find(m => m.uId === authUserId) === undefined) {
    return { error: 'User is no longer a dm member' };
  }

  const uIds = [];
  for (const dm of data.dmData) {
    if (dm.dmId === dmId) {
      for (const member of dm.members) {
        uIds.push(member.uId);
      }
    }
  }

  // Remove DM from dmData array in dataStore
  for (let i = 0; i < data.dmData.length; i++) {
    if (data.dmData[i].dmId === dmId) {
      data.dmData.splice(i, 1);
    }
  }

  for (const uId of uIds) {
    for (const user of data.userData) {
      if (user.uId === uId) {
        const obj = {
          numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined - 1,
          timeStamp: timeStamp,
        };
        user.userStats.dmsJoined.push(obj);
      }
    }
  }

  setData(data);
  return {};
}

export { dmCreateV1, dmListV1, dmDetailsV1, dmMessagesV1, dmRemoveV1, dmLeaveV1 };
