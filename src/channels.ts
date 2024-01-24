import { Channel, Error, getData, Member, setData } from './dataStore';
import { getUNIXTime } from './other';

type ChannelsList = {
  channelId: number,
  name: string,
};

type ChannelsListWrapper = {
  channels: ChannelsList[]
};
// Function that provides an array of all channels (and associated details)
// regardless of publicness
//
// @params {number} authUserId:     user who is making the request
// @returns {channels: {array}}:    array of channel objects
function channelsListallV1(authUserId: number): ChannelsListWrapper {
  const data = getData();
  const channels = [];

  for (const channel of data.channels) {
    const currChannel = {
      channelId: channel.id,
      name: channel.name,
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
function channelsListV1(authUserId: number): ChannelsListWrapper {
  const data = getData();

  const channels = [];

  for (const channel of data.channels) {
    for (const member of channel.allMembers) {
      if (member.id === authUserId) {
        const currChannel = {
          channelId: channel.id,
          name: channel.name,
        };
        channels.push(currChannel);
      }
    }
  }

  return { channels: channels };
}

type ChannelId = { channelId: number };
// Function creates a new channel with given name that can be either public
// or private. The user who creates the channel automatically joins the channel
//
// @param {number} authUserId:          user who is making the request
// @param {string} name:                name of channel to be created
// @param {boolean} isPublic:           determines whether channel is public or private
// @returns {channelId} object:         if channel created with no errors
// @returns {error: 'error'} object:    if channel name is not 1-20 characters long
function channelsCreateV1(authUserId: number, name: string, isPublic: boolean): ChannelId | Error {
  const timeStamp = getUNIXTime();
  // Return error if invalid channel name
  if (name.length < 1 || name.length > 20) {
    return { error: 'Invalid channel name' };
  }

  const data = getData();
  const channels = data.channels;
  const users = data.users;

  // Finds user details of channel creator to populate _Members arrays with userCreator objects
  let uId: number;
  let handleStr: string;
  let nameFirst: string;
  let nameLast: string;
  let email: string;
  for (const user of users) {
    if (user.id === authUserId) {
      uId = authUserId;
      handleStr = user.handle;
      nameFirst = user.nameFirst;
      nameLast = user.nameLast;
      email = user.email;
    }
  }
  const userCreator: Member = {
    id: uId,
    handle: handleStr,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
  };
  const newChannel: Channel = {
    id: channels.length + 1,
    name: name,
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

  for (const user of data.users) {
    if (user.id === authUserId) {
      const obj = {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
        timeStamp: timeStamp,
      };
      user.userStats.channelsJoined.push(obj);
    }
  }

  setData(data);

  return { channelId: newChannel.id };
}

//  This is a helper function used in the server to generate correct output
// function channelsListFormat(channels: any): channelsListFn {
//   for (const i of channels.channels) {
//     i.name = i.name.name;
//   }
//   return channels;
// }

export { channelsCreateV1, channelsListV1, channelsListallV1 };
