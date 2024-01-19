import { getData, setData } from './dataStore';
import { getUNIXTime } from './other';
import {
  channelData,
  channelIdType,
  channelsListFn,
  errorType,
  member
} from './types';

// Function that provides an array of all channels (and associated details)
// regardless of publicness
//
// @params {number} authUserId:     user who is making the request
// @returns {channels: {array}}:    array of channel objects
function channelsListallV1(authUserId: number): channelsListFn {
  const data = getData();
  const channels = [];

  for (const channel of data.channelData) {
    const currChannel = {
      channelId: channel.channelId,
      name: channel.channelName,
    };
    channels.push(currChannel);
  }

  return { channels: channels };
}

// Function that provides an array of all channels (and associated details) that
// the authorised user is a member of regardless of publicness
//
// @params {number} authUserId:     user who is making the request
// @returns {channels: {array}}:    array of channel objects
function channelsListV1(authUserId: number): channelsListFn {
  const data = getData();

  const channels = [];

  for (const channel of data.channelData) {
    for (const member of channel.allMembers) {
      if (member.uId === authUserId) {
        const currChannel = {
          channelId: channel.channelId,
          name: channel.channelName,
        };
        channels.push(currChannel);
      }
    }
  }

  return { channels: channels };
}

// Function creates a new channel with given name that can be either public
// or private. The user who creates the channel automatically joins the channel
//
// @param {number} authUserId:          user who is making the request
// @param {string} name:                name of channel to be created
// @param {boolean} isPublic:           determines whether channel is public or private
// @returns {channelId} object:         if channel created with no errors
// @returns {error: 'error'} object:    if channel name is not 1-20 characters long
function channelsCreateV1(authUserId: number, name: string, isPublic: boolean): channelIdType | errorType {
  const timeStamp = getUNIXTime();
  // Return error if invalid channel name
  if (name.length < 1 || name.length > 20) {
    return { error: 'Invalid channel name' };
  }

  const data = getData();
  const channels = data.channelData;
  const users = data.userData;

  // Finds user details of channel creator to populate _Members arrays with userCreator objects
  let uId: number;
  let handleStr: string;
  let nameFirst: string;
  let nameLast: string;
  let email: string;
  for (const user of users) {
    if (user.uId === authUserId) {
      uId = authUserId;
      handleStr = user.handleStr;
      nameFirst = user.nameFirst;
      nameLast = user.nameLast;
      email = user.email;
    }
  }
  const userCreator: member = {
    uId: uId,
    handleStr: handleStr,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
  };
  const newChannel: channelData = {
    channelId: channels.length + 1,
    channelName: name,
    isPublic: isPublic,
    ownerMembers: [userCreator],
    allMembers: [userCreator],
    messages: [],
    standup: {
      isActive: false,
      timeFinish: null,
      standupMessages: [],
    },
  };

  // Add newChannel to dataStore
  channels.push(newChannel);

  for (const user of data.userData) {
    if (user.uId === authUserId) {
      const obj = {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
        timeStamp: timeStamp,
      };
      user.userStats.channelsJoined.push(obj);
    }
  }

  setData(data);

  return { channelId: newChannel.channelId };
}

//  This is a helper function used in the server to generate correct output
// function channelsListFormat(channels: any): channelsListFn {
//   for (const i of channels.channels) {
//     i.name = i.name.name;
//   }
//   return channels;
// }

export { channelsCreateV1, channelsListV1, channelsListallV1 };
