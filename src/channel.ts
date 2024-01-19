import { getData, setData } from './dataStore';
import { userProfileV2 } from './users';
import {
  channelData,
  channelMessages,
  member,
  userData,
  errorType,
  channelDetailType,
  emptyType
} from './types';
import { checkStart, getUNIXTime, isUserMemberOfChannel, validateChannel } from './other';

// Channel file (typescript)
// channel.ts

/**
 * channelJoinV1
 * Allows a treats user to join a channel
 * Arguments:
 *  authUserId  (Integer)  - unique identifier of the user attempting to join a channel
 *  channelId   (Integer)  - unique identifier of the channel the user is attempting to join
 * Return Value:
 *  Returns  {error: 'error'} if channelId doesn't refer to any existing channel
 *  Returns  {error: 'error'} if the channel is private and the user is a treats member
 *  Returns  {error: 'error'} if the user is already a member of the channel
 *  Returns  {}               if the user has successfully joined the channel
 */
// Writen by Srihari Kannan Jayaraman (z5418120)
function channelJoinV1 (authUserId: number, channelId: number): emptyType | errorType {
  const timeStamp = getUNIXTime();
  const data = getData();
  const channels = data.channelData;
  const users = data.userData;

  // get channel and check if it's valid
  const currentChannel = channels.find(
    (channel: channelData) => channel.channelId === channelId
  );
  if (currentChannel === undefined) {
    return { error: 'Invalid channelId' };
  }

  // Get user from userDetails
  // NOTE: assumes that authUserId is valid
  const currentUser = users.find(
    (user: userData) => user.uId === authUserId
  );

  // Check if user is already in channel
  if (currentChannel.allMembers.findIndex(
    (member: member) => member.uId === authUserId
  ) >= 0) return { error: 'Already in channel' };

  // Check whether channel is private and user is a global owner
  if (!currentChannel.isPublic && currentUser.permission !== 1) {
    return { error: 'Joining private channel without global permissions' };
  }

  // Add user to channel
  // Refer to properties individually to avoid displaying password
  // Get token
  const token: string = data.userTokens.find(tokenObj => tokenObj.authUserId === authUserId).token;
  currentChannel.allMembers.push((userProfileV2(token, authUserId) as { user: member }).user);
  for (const user of data.userData) {
    if (user.uId === authUserId) {
      const obj = {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
        timeStamp: timeStamp,
      };
      user.userStats.channelsJoined.push(obj);
    }
  }
  // Set changes in dataStore.js
  setData(data);

  return {};
}

/**
 * channelDetailsV1
 * Provides information about a specified channel the user is a member of
 * Arguments:
 *  authUserId  (Integer)  - unique identifier of the user seeking channel details
 *  channelId   (Integer)  - unique identifier of the channel to find details of
 * Return Value:
 *  Returns  {error: 'error'} if channelId doesn't refer to any existing channel
 *  Returns  {error: 'error'} if the user is not already a member of the channel
 *  Returns  {name, isPublic, ownerMembers, allMembers}
 *    if the user has successfully joined the channel
 */
// Written by Srihari Kannan Jayaraman (z5418120)
const channelDetailsV1 = (authUserId: number, channelId: number): channelDetailType | errorType => {
  // Fetch from dataStore.js
  const data = getData();
  const channels = data.channelData;
  // const users = data.userData;

  // Find channel[]
  const currentChannel = channels.find(
    (channel: channelData) => channel.channelId === channelId
  );
  if (currentChannel === undefined) return { error: 'Invalid channelId' };

  // Check user is in the channel
  // NOTE: Assumes that authUserId is valid
  const currentUser = currentChannel.allMembers.find(
    (member: member) => member.uId === authUserId
  );
  if (currentUser === undefined) return { error: 'User is not in channel' };

  // Return channel details
  return {
    name: currentChannel.channelName,
    isPublic: currentChannel.isPublic,
    ownerMembers: currentChannel.ownerMembers,
    allMembers: currentChannel.allMembers
  };
};

// Description: returns up to 50 messages of a channel
//
// Arguments:
//     authUserId (integer) - Id of user that calls the function
//     channelId (integer) - Id of channel the user wants messages of
//     start (integer) - Return messages with index start to index start + 50
// Return value:
//     Returns {
//         messages: [messages],
//         start: start,
//         end: start + 50,
//     } when end is less than total number of messages in the channel
//
//     Returns {
//         messages: [messages],
//         start: start,
//         end: -1,
//     } when end is greater than total number of messages in the channel
export const channelMessagesV2 = (token: string, channelId: number, start: number): errorType | channelMessages => {
  if (!validateChannel(channelId)) {
    return { error: 'Invalid channelId' };
  }
  if (!checkStart(channelId, start)) {
    return { error: 'Start is greater than the number of messages' };
  }
  if (!isUserMemberOfChannel(token, channelId)) {
    return { error: 'User is not a channel member' };
  }

  const data = getData();
  const channelMessages = [];
  let end = start + 50;
  let finishedMessages = false;
  for (const channel of data.channelData) {
    if (channel.channelId === channelId) {
      if (end >= channel.messages.length) {
        end = channel.messages.length;
        finishedMessages = true;
      }
      for (let i = start; i < end; i++) {
        channelMessages.push(channel.messages[i]);
      }
    }
  }
  if (finishedMessages) {
    end = -1;
  }

  return {
    messages: channelMessages,
    start: start,
    end: end,
  };
};

// Function stub for channelInviteV1
// Returns arguments as a concatenated string
/*
* @param {Number} authUserId = user id of the person inviting
* @param {Number} channelId = id of the channel that the uId is being invited to
* @param {Number} uId = id of the person being invited
* @returns {} on the success that uId exists, that channelId exists and
              that authUserId exists and is a member of the channel
* @returns {error: 'error'} on the failure that the conditions that requires
            a success is not met
*/
// Eugene Lee z5164367 15/7/22
const channelInviteV1 = (authUserId: number, channelId: number, uId: number): emptyType | errorType => {
  const timeStamp = getUNIXTime();
  const data = getData();
  const users = data.userData;
  const channels = data.channelData;

  if (channels.find(c => c.channelId === channelId) === undefined) {
    return { error: 'Invalid channelId' };
  }
  const userToInvite = users.find(u => u.uId === uId);
  // invalid uID
  if (userToInvite === undefined) {
    return { error: 'Invalid uId' };
  }
  const channelInvite = channels.find(c => c.channelId === channelId);
  if (channelInvite.allMembers.find(member => member.uId === uId) !== undefined) {
    return { error: 'Invitee is already in the channel' };
  }
  if (channelInvite.ownerMembers.find(member => member.uId === authUserId) === undefined) {
    return { error: 'Inviter is not in the channel' };
  }

  // Success
  channelInvite.allMembers.push(userToInvite);
  for (const user of data.userData) {
    if (user.uId === uId) {
      const obj = {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
        timeStamp: timeStamp,
      };
      user.userStats.channelsJoined.push(obj);
    }
  }
  setData(data);
  return {};
};

// channel/leave/v1
//
// Given a channel of ID channelId that the authUser is a member of, removes them
// as a member of the channel
//
// @param {number} authUserId -> identifies the user
// @param {number} channelId = channel to remove user from
// @return {} = if no error
// @return {error: 'error'} = channelId not valid channel, or authUserId not valid member of channel
// Eugene Lee z5164367 12/7/22
function channelLeaveV1(authUserId: number, channelId: number) {
  const timeStamp = getUNIXTime();
  const data = getData();
  const channels = data.channelData;

  // Return error if channelId does not refer to a valid channel
  const channelLeaveFrom = channels.find(c => c.channelId === channelId);
  if (channelLeaveFrom === undefined) {
    return { error: 'Invalid channelId' };
  }
  // Return error if channelId is valid, but authUser is not a member of the channel
  const userLeaving = channelLeaveFrom.allMembers.find(user => user.uId === authUserId);
  if (userLeaving === undefined) {
    return { error: 'User is not a channel member' };
  }

  // Remove user from channel _Members arrays
  for (let i = 0; i < channelLeaveFrom.allMembers.length; i++) {
    if (channelLeaveFrom.allMembers[i].uId === userLeaving.uId) {
      channelLeaveFrom.allMembers.splice(i, 1);
    }
  }
  for (let i = 0; i < channelLeaveFrom.ownerMembers.length; i++) {
    if (channelLeaveFrom.ownerMembers[i].uId === userLeaving.uId) {
      channelLeaveFrom.ownerMembers.splice(i, 1);
    }
  }
  for (const user of data.userData) {
    if (user.uId === authUserId) {
      const obj = {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined - 1,
        timeStamp: timeStamp,
      };
      user.userStats.channelsJoined.push(obj);
    }
  }
  setData(data);
  return {};
}

// channel/addowner/v1
//
// Function makes user of ID 'uId' as an owner of the channel
//
// @param {number} token = token storing authUser's session
// @param {number} channelId = channel to make user of user ID 'uID' an owner of
// @param {number} uId = user to be made owner of channel ID 'channelId'
// @return {} = if no error
// @return {error: 'error'} = if errors as below comments
// Eugene Lee z5164367 12/7/22
function channelAddOwnerV1(authUserId: number, channelId: number, uId: number) {
  const data = getData();
  const channelAddOwner = data.channelData.find(c => c.channelId === channelId);
  const userMakeOwner = data.userData.find(u => u.uId === uId);

  // Return error if channelId does not refer to a valid channel
  // Return error if uId does not refer to a valid user
  if (channelAddOwner === undefined) return { error: 'Invalid channelId' };
  if (userMakeOwner === undefined) return { error: 'Invalid uId' };

  // Return error if user of ID 'uId' is not a member of the channel
  if (channelAddOwner.allMembers.find(u => u.uId === userMakeOwner.uId) === undefined) {
    return { error: 'Selected user is not a channel member' };
  }
  // Return error if user of ID 'uId' is already an owner of the channel
  for (const owner of channelAddOwner.ownerMembers) {
    if (owner.uId === uId) {
      return { error: 'Selected user is already an owner' };
    }
  }
  // Return error if channelId is valid but authUser does not have owner permissions in the channel
  if (channelAddOwner.ownerMembers.find(u => u.uId === authUserId) === undefined) {
    return { error: 'User is not a channel owner' };
  }

  // Make user 'uId' an owner of the channel
  const newOwner = {
    uId: uId,
    handleStr: userMakeOwner.handleStr,
    nameFirst: userMakeOwner.nameFirst,
    nameLast: userMakeOwner.nameLast,
    email: userMakeOwner.email,
  };
  channelAddOwner.ownerMembers.push(newOwner);
  setData(data);
  return {};
}

// channel/removeowner/v1
//
// Function removes user of ID 'uId' as an owner of the channel
//
// @param {number} token = token storing authUser's session
// @param {number} channelId = channel to remove user of user ID 'uID' as an owner of
// @param {number} uId = user to be removed as an owner of channel ID 'channelId'
// @return {} = if no error
// @return {error: 'error'} = if errors as below comments
// Eugene Lee z5164367 12/7/22
function channelRemoveOwnerV1(authUserId: number, channelId: number, uId: number) {
  const data = getData();
  const channelRemoveOwner = data.channelData.find(c => c.channelId === channelId);
  const userRemoveOwner = data.userData.find(u => u.uId === uId);
  const authUser = data.userData.find(u => u.uId === authUserId);

  // Return error if channelId does not refer to a valid channel
  // Return error if uId does not refer to a valid user
  if (channelRemoveOwner === undefined || userRemoveOwner === undefined) {
    return { error: 'Invalid channelId' };
  }
  // Return error if user of ID 'uId' is not an owner of the channel
  if (channelRemoveOwner.ownerMembers.find(u => u.uId === userRemoveOwner.uId) === undefined) {
    return { error: 'Target user is not a channel owner' };
  }
  // Return error if user of ID 'uId' is currently the only owner of the channel
  for (const owner of channelRemoveOwner.ownerMembers) {
    if (owner.uId === uId && channelRemoveOwner.ownerMembers.length === 1) {
      return { error: 'User is the only channel owner' };
    }
  }

  // Remove owner if authUser has global owner permissions
  if (authUser.permission === 1) {
    for (let i = 0; i < channelRemoveOwner.ownerMembers.length; i++) {
      if (channelRemoveOwner.ownerMembers[i].uId === uId) {
        channelRemoveOwner.ownerMembers.splice(i, 1);
      }
    }
    setData(data);
    return {};
  }

  // Return error if channelId is valid but authUser does not have owner permissions in the channel
  if (channelRemoveOwner.ownerMembers.find(u => u.uId === authUserId) === undefined) {
    return { error: 'authUser does not have owner permissions' };
  }

  // Remove user 'uId' as an owner of the channel
  for (let i = 0; i < channelRemoveOwner.ownerMembers.length; i++) {
    if (channelRemoveOwner.ownerMembers[i].uId === uId) {
      channelRemoveOwner.ownerMembers.splice(i, 1);
    }
  }
  setData(data);
  return {};
}

export {
  channelJoinV1,
  channelDetailsV1,
  channelInviteV1,
  channelLeaveV1,
  channelAddOwnerV1,
  channelRemoveOwnerV1,
};
