import { getData, setData } from './dataStore';
import { tokenToUId, getUNIXTime } from './other';
import { messageSendV1 } from './message';

// standup/start/v1
//
// Starts a standup in a given channel which lasts 'length' seconds, messages sent
// during standup duration are buffered then sent as a single packaged message to the channel
//
// Arguments
//    channelId {number} = channelId to start standup in
//    length {number} = duration of standup in seconds
// Returns
//    return { timeFinish } = if no error, timeFinish = integer (unix timestamp in seconds),
//    return { error: 'error' } = if errors as below comments
// Eugene Lee z5164367 5/8/22
function standupStartV1(channelId: number, length: number, token: string) {
  const data = getData();
  const channel = data.channelData.find(c => c.channelId === channelId);
  const authUserId = tokenToUId(token);

  // Return error if invalid channelId
  if (channel === undefined) {
    return { error: { code: 400, message: 'Invalid channelId' } };
  }
  // Return error if length is a negative integer
  if (length < 0) {
    return { error: { code: 400, message: 'Invalid length' } };
  }
  // Return error if standup already running in channel
  if (channel.standup.isActive) {
    return { error: { code: 400, message: 'An active standup is already running in channel' } };
  }
  // Return error if valid channelId but authUser is not a member of channel
  if (channel.allMembers.find(m => m.uId === authUserId) === undefined) {
    return { error: { code: 403, message: 'Valid channelId but authUser is not a member of channel' } };
  }

  const timeFinish = getUNIXTime() + length;
  channel.standup = {
    isActive: true,
    timeFinish: timeFinish,
    standupMessages: [],
  };
  setData(data);

  function finishStandup() {
    const standupSend = 'test'; // remove test later
    // Package standupMessages[] into one message 'standupSend'
    for (const message of channel.standup.standupMessages) {
      standupSend.concat(`${message.userHandle}`, ': ', `${message.message}`, '\n');
    }

    // Send packaged message to channel from authUser
    messageSendV1(token, channelId, standupSend);

    // Modify properties of channel.standup for standup end
    channel.standup = {
      isActive: false,
      timeFinish: null,
      standupMessages: [],
    };
    setData(data);
  }

  console.log(`You've started a standup for ${length} seconds`);
  setTimeout(finishStandup, length * 1000);
  return { timeFinish: timeFinish };
}

// standup/active/v1
//
// Returns whether a standup is active & what time it finishes in a given channel
//
// Arguments
//    channelId {number} = channelId to check if standup is active in it
// Returns
//    return { isActive, timeFinish } = if no error
//    return { error: 'error' } = if errors as below comments
// Eugene Lee z5164367 5/8/22
function standupActiveV1(channelId: number, token: string) {
  const data = getData();
  const channel = data.channelData.find(c => c.channelId === channelId);
  const authUserId = tokenToUId(token);

  // Return error if invalid channelId
  if (channel === undefined) {
    return { error: { code: 400, message: 'Invalid channelId' } };
  }
  // Return error if valid channelId but authUser is not a member of channel
  if (channel.allMembers.find(m => m.uId === authUserId) === undefined) {
    return { error: { code: 403, message: 'Valid channelId but authUser is not a member of channel' } };
  }

  return {
    isActive: channel.standup.isActive,
    timeFinish: channel.standup.timeFinish,
  };
}

// standup/send/v1
//
// Sends a message to get buffered in standup queue, if standup is currently
// active in given channel
//
// Arguments
//    channelId {number} = channelId to send buffered standup message to
//    message {string} = content of message to be sent
// Returns
//    return { } = if no error
//    return { error: 'error' } = if errors as below comments
// Eugene Lee z5164367 5/8/22
function standupSendV1(channelId: number, message: string, token: string) {
  const data = getData();
  const channel = data.channelData.find(c => c.channelId === channelId);
  const authUserId = tokenToUId(token);
  const authUser = data.userData.find(u => u.uId === authUserId);

  // Return error if invalid channelId
  if (channel === undefined) {
    return { error: { code: 400, message: 'Invalid channelId' } };
  }
  // Return error if length is a negative integer
  if (message.length > 1000) {
    return { error: { code: 400, message: 'Invalid message length (>1000 characters)' } };
  }
  // Return error if an active standup is not currently running in channel
  if (!channel.standup.isActive) {
    return { error: { code: 400, message: 'No active standup running in channel' } };
  }
  // Return error if valid channelId but authUser is not a member of channel
  if (channel.allMembers.find(m => m.uId === authUserId) === undefined) {
    return { error: { code: 403, message: 'Valid channelId but authUser is not a member of channel' } };
  }

  // Push message to standupMessages[]
  const standupMessage = {
    userHandle: authUser.handleStr,
    message: message,
  };
  channel.standup.standupMessages.push(standupMessage);
  return {};
}

export { standupStartV1, standupActiveV1, standupSendV1 };
