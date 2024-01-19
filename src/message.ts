import { getData, setData } from './dataStore';
import {
  getIndexOfChannel,
  getUNIXTime,
  tokenToUId,
  validateChannel,
  validateUserMember,
  generateMessageId,
  isMemberOfDm,
  isValidDm,
  isValidMessage,
  isMessageSentByUser,
  isUserOwner
} from './other';
import { emptyType, errorType, message, messageIdType } from './types';

export const messageSenddmV1 = (token: string, dmId: number, message: string) => {
  const timeStamp = getUNIXTime();
  // Validation
  if (!isValidDm(dmId)) {
    return { error: 'Invalid dm' };
  }
  if (message.length > 1000) return { error: 'Message is too long' };
  if (message.length < 1) return { error: 'Message is too short' };

  if (!isMemberOfDm(token, dmId)) return { error: 'User is not a dm member' };

  // Send message
  const data = getData();
  const messageId = generateMessageId();
  const newMessage: message = {
    messageId: messageId,
    uId: tokenToUId(token) as number,
    message: message,
    timeSent: getUNIXTime(),
  };
  for (const dm of data.dmData) {
    if (dm.dmId === dmId) {
      dm.messages.unshift(newMessage);
    }
  }

  for (const user of data.userData) {
    if (user.uId === tokenToUId(token)) {
      const obj = {
        numMessagesSent: user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent + 1,
        timeStamp: timeStamp,
      };
      user.userStats.messagesSent.push(obj);
    }
  }

  setData(data);

  return { messageId: messageId };
};

export const messageSendV1 = (token: string, channelId: number, message: string): messageIdType | errorType => {
  const timeStamp = getUNIXTime();
  const data = getData();

  if (!validateChannel(channelId)) {
    return { error: 'Invalid channelId' };
  }

  const authUserId = tokenToUId(token) as number;
  if (!validateUserMember(authUserId, channelId)) {
    return { error: 'User is not a channel member' };
  }

  // Validate message length
  if (message.length < 1) return { error: 'Message is too short' };
  if (message.length > 1000) return { error: 'Message is too long' };

  const newMessage: message = {
    messageId: generateMessageId(),
    uId: tokenToUId(token) as number,
    message: message,
    timeSent: getUNIXTime(),
  };
  const index = getIndexOfChannel(channelId) as number;
  data.channelData[index].messages.unshift(newMessage);

  for (const user of data.userData) {
    if (user.uId === authUserId) {
      const obj = {
        numMessagesSent: user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent + 1,
        timeStamp: timeStamp,
      };
      user.userStats.messagesSent.push(obj);
    }
  }

  setData(data);
  return { messageId: newMessage.messageId };
};

export const messageEditV1 = (token: string, messageId: number, message: string): emptyType | errorType => {
  if (message.length > 1000) {
    return { error: 'Edited message is too long' };
  }
  if (!isValidMessage(token, messageId)) {
    return { error: 'Invalid message' };
  }
  if (!isMessageSentByUser(token, messageId) && !isUserOwner(token, messageId)) {
    return { error: 'User is not an owner and message is not theirs' };
  }

  let isMessageEmpty = false;
  if (message === '') {
    isMessageEmpty = true;
  }

  const data = getData();
  for (const channel of data.channelData) {
    for (const channelMessage of channel.messages) {
      if (channelMessage.messageId === messageId) {
        if (isMessageEmpty) {
          channel.messages = channel.messages.filter((message) => message.messageId !== messageId);
          setData(data);
          return {};
        }
        channelMessage.message = message;
        setData(data);
        return {};
      }
    }
  }

  for (const dm of data.dmData) {
    for (const dmMessage of dm.messages) {
      if (dmMessage.messageId === messageId) {
        if (isMessageEmpty) {
          dm.messages = dm.messages.filter((message) => message.messageId !== messageId);
          setData(data);
          return {};
        }
        dmMessage.message = message;
        setData(data);
        return {};
      }
    }
  }
  // return { error: 'error' };
};

export const messageRemoveV1 = (token: string, messageId: number) => {
  const timeStamp = getUNIXTime();
  if (!isValidMessage(token, messageId)) {
    return { error: 'Invalid message' };
  }
  if (!isMessageSentByUser(token, messageId) && !isUserOwner(token, messageId)) {
    return { error: 'User is not an owner and message is not theirs' };
  }
  const data = getData();

  for (const user of data.userData) {
    if (user.uId === tokenToUId(token)) {
      const obj = {
        numMessagesSent: user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent - 1,
        timeStamp: timeStamp,
      };
      user.userStats.messagesSent.push(obj);
    }
  }

  for (const channel of data.channelData) {
    for (const message of channel.messages) {
      if (message.messageId === messageId) {
        channel.messages = channel.messages.filter((message) => message.messageId !== messageId);
        setData(data);
        return {};
      }
    }
  }
  for (const dm of data.dmData) {
    for (const message of dm.messages) {
      if (message.messageId === messageId) {
        dm.messages = dm.messages.filter((message) => message.messageId !== messageId);
        setData(data);
        return {};
      }
    }
  }
  // return { error: 'error' };
};
