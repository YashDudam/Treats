// dm.ts
// Implements direct messaging features
import { Dm, Empty, Error, getData, Member, Message, setData } from './dataStore';
import { getUNIXTime } from './other';

type DmId = { dmId: number };
// Creates a new dm
// Arguments:
//     <authUserId> (number)    - user id
//     <uIds> (number[])    - ids of people to add
// Return Value:
//     Returns { error: ... } if any values are invalid
//     Returns { dmId: number } if successful
const dmCreateV1 = (authUserId: number, uIds: number[]): DmId | Error => {
  const timeStamp = getUNIXTime();
  const data = getData();
  const users = data.users;
  const dms = data.dms;
  const memberHandles: string[] = [];
  let dmName: string;

  // Get details of user creating dm
  const ownerUser = users.find(user => user.id === authUserId);

  memberHandles.push(ownerUser.handle);

  const owner: Member = {
    id: authUserId,
    handle: ownerUser.handle,
    nameFirst: ownerUser.nameFirst,
    nameLast: ownerUser.nameLast,
    email: ownerUser.email
  };

  // Initialise new dm
  const newDm: Dm = {
    name: undefined,
    id: dms.length + 1,
    owner: owner,
    members: [owner],
    messages: []
  };

  // Check uIds
  // Assumes that authUserId and the user calling the function is valid
  for (const uId of uIds) {
    // Validity check
    const user = users.find(user => user.id === uId);
    if (user === undefined) return { error: 'Invalid user(s)' };

    // Add to memberHandles for sorting
    memberHandles.push(user.handle);

    // Duplicate check
    let instances = 0;
    uIds.forEach(uId2 => {
      if (uId === uId2) {
        instances++;
      }
    });
    if (instances !== 1) return { error: 'Duplicate uIds' };

    // If valid add to members
    const newMember: Member = {
      id: uId,
      handle: user.handle,
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
    for (const user of data.users) {
      if (user.id === uId) {
        const obj = {
          numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined + 1,
          timeStamp: timeStamp,
        };
        user.userStats.dmsJoined.push(obj);
      }
    }
  }
  setData(data);

  return { dmId: newDm.id };
};

type DmList = {
  dmId: number,
  name: string,
};

type DmListWrapper = { dms: DmList[] };
// Provides an array of dms the specified user is in
// Arguments:
//     <authUserId> (number)    - user id
// Return Value:
//     Returns an array of { dmId: number, name: string }
const dmListV1 = (authUserId: number): DmListWrapper => {
  const data = getData();
  const dms = data.dms;
  const dmList: DmList[] = [];

  dms.forEach((dm) => {
    dm.members.forEach((member: Member) => {
      if (member.id === authUserId) {
        dmList.push({
          dmId: dm.id,
          name: dm.name
        });
      }
    });
  });

  return { dms: dmList };
};

type DmDetails = {
  name: string,
  members: Member[]
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
const dmDetailsV1 = (authUserId: number, dmId: number): DmDetails | Error => {
  const data = getData();
  const dms = data.dms;

  // Get relevant dm and check that dmId is valid
  const dm = dms.find(dm => dm.id === dmId);
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Check member is in dm
  const memberIndex = dm.members.findIndex(member => member.id === authUserId);
  if (memberIndex < 0) return { error: 'User is not a dm member' };

  return {
    name: dm.name,
    members: dm.members
  };
};

type DmMessages = {
  messages: Message[],
  start: number,
  end: number
}
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
const dmMessagesV1 = (authUserId: number, dmId: number, start: number): DmMessages | Error => {
  const data = getData();
  const dms = data.dms;

  // settings
  const DISPLAYED_ALL_MESSAGES = -1;
  const DISPLAY_COUNT = 50;

  let limit = start + DISPLAY_COUNT;
  let end = start + DISPLAY_COUNT;

  // Get relevant dm and check that dmId is valid
  const dm = dms.find(dm => dm.id === dmId);
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Make sure start is valid
  if (start >= dm.messages.length) return { error: 'Start is greater than number of messages in dm' };

  // Limit end to end of messages
  if (limit > dm.messages.length) {
    limit = dm.messages.length;
    end = DISPLAYED_ALL_MESSAGES;
  }

  // Check member is in dm
  const memberIndex = dm.members.findIndex((member: Member) => member.id === authUserId);
  if (memberIndex < 0) return { error: 'User is not a dm member' };

  // Populate return object
  const dmMessages: DmMessages = {
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
const dmLeaveV1 = (authUserId: number, dmId: number): Empty | Error => {
  const timeStamp = getUNIXTime();
  const data = getData();

  // Get dm and check that it exists
  const dm = data.dms.find(dm => dm.id === dmId);
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Check user is a member of dm
  const memberIndex = dm.members.findIndex(member => member.id === authUserId);
  if (memberIndex < 0) return { error: 'User is not a dm member' };

  // Remove user from dm
  dm.members.splice(memberIndex, 1);

  // Sets owner to undefined if owner leaves
  if (dm.owner.id === dmId) dm.owner = undefined;

  for (const user of data.users) {
    if (user.id === authUserId) {
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
  const dm = data.dms.find(dm => dm.id === dmId);

  // Return error if dmId not valid
  if (dm === undefined) return { error: 'Invalid dmId' };

  // Return error if valid dmId but authUser is not the original DM creator
  if (dm.owner === undefined || authUserId !== dm.owner.id) {
    return { error: 'User is not the original DM creator' };
  }
  // Return error if authUser no longer in the DM
  if (dm.members.find(m => m.id === authUserId) === undefined) {
    return { error: 'User is no longer a dm member' };
  }

  const uIds = [];
  for (const dm of data.dms) {
    if (dm.id === dmId) {
      for (const member of dm.members) {
        uIds.push(member.id);
      }
    }
  }

  // Remove DM from dmData array in dataStore
  for (let i = 0; i < data.dms.length; i++) {
    if (data.dms[i].id === dmId) {
      data.dms.splice(i, 1);
    }
  }

  for (const uId of uIds) {
    for (const user of data.users) {
      if (user.id === uId) {
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
