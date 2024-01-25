import { getData, setData } from './dataStore';
import config from './config.json';
import HTTPError from 'http-errors';
import hash from 'object-hash';

const SERVER_URL = `${config.url}:${config.port}`;
const SECRET = 'leon';

// generates a random 5 digit number then converts to a string
/*
*@returns {String}  = a unique 5 digit string containing the numbers 0-9
*/
const generateToken = (authUserId: number) => {
  const data = getData();

  // generates a new token
  let newToken = (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000).toString();

  // while loop that ensures that it doesn't already exist, and create a new one if it does
  // while (data.userTokens.find((tokenObject) => tokenObject.token === newToken) as unknown as string !== 'undefined') {
  //   newToken = (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000).toString();
  // }
  let i = 0;
  while (i < data.tokens.length) {
    if (hash(newToken) === data.tokens[i].token) {
      newToken = (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000).toString();
      i = -1;
    }
    i++;
  }
  const Obj = {
    token: hash(newToken + SECRET),
    authUserId: authUserId,
  };
  data.tokens.push(Obj);
  setData(data);

  return newToken;
};

// because tokens are used a lot I made a quick helper function to determine if a token exists
/*
*@param {String} token = a length 5 string
*@returns {Boolean} = true if it exists, false if it does not
*/
const validateToken = (token: string): boolean => {
  const data = getData();
  // console.log(data);
  // console.log(token);
  // if (data.userTokens.find((tokenObject) => tokenObject.token === token)) {
  //   return true;
  // } else {
  //   return false;
  // }
  // C coded style of searching through array because idk if the js version works
  let tokenCheck = false;

  for (let i = 0; i < data.tokens.length; ++i) {
    if (hash(token + SECRET) === data.tokens[i].token) {
      tokenCheck = true;
    }
  }

  return tokenCheck;
};

// retrieves the uId given the token
// Assumes that token is validated
/*
*@param {String} token = a unique 5 length string making the request. Belongs to a user in session
*@returns {Number} uId = the uId associated with the user in the session
*/
const tokenToUId = (token: string): number | errorType => {
  const data = getData();
  // if (!validateToken(token)) {
  //   return { error: 'Token does not exist' };
  // }

  const tokenIndex = data.tokens.findIndex((tokenObject) => tokenObject.token === hash(token + SECRET));
  return data.tokens[tokenIndex].authUserId;
  // for (let i = 0; i < data.validTokens.length; ++i){
  //   if(token === data.validTokens[i].token){
  //     return data.validTokens[i].uId
  //   }
  // }
  // return {error: error}
};

// to delete a token once used. I'm not great at list manipulation so this will need tweaking
/*
*@param {string} token = the token that needs to be deleted due to the logout
*@returns {nothing} = however the dataStore.validToken will have the token removed
*/
/* const removeToken = (token: string) => {
  const data = getData();
  for (let i = 0; i < data.userTokens.length; ++i) {
    if (token === data.userTokens[i].token) {
      data.userTokens.splice(i, 1);
    }
  }
  setData(data);
}; */

// Description: Clears the userData and channelData keys in dataStore
//
// Arguments:
//   void
//
// Return Value:
//   returns {}
//
function clearV1(): emptyType {
  let data = getData();
  // reassign data with cleared userData and channelData keys
  data = {
    users: [],
    channels: [],
    tokens: [],
    dms: []
  };
  // update changes to dataStore.js
  setData(data);
  // return empty object
  return {};
}

// given a channelId, checks whether the channel exists or not
/*
* @param {number} channelId = the channelId of the given channel
* @return {boolean} = true if channel exists, false if it does not
*/
const validateChannel = (channelId: number): boolean => {
  const data = getData();
  for (const channel of data.channels) {
    if (channel.id === channelId) {
      return true;
    }
  }
  return false;
};

// given a uId and channelId, will check that the user is a member of said channel
/*
* @param {number} uId = the uId of the user
* @param {number} channelId = the channelId of the channel to check user is a member of
* @return {boolean}
*/
const validateUserMember = (uId: number, channelId: number) => {
  const data = getData();
  const channel = data.channels.find((channel) => channel.id === channelId);
  const user = channel.allMembers.find((member) => member.id === uId);
  if (user === undefined) {
    return false;
  }
  return true;
};

const generateMessageId = (): number => {
  const data = getData();
  const allMessageIds: number[] = [];
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      allMessageIds.push(message.messageId);
    }
  }
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      allMessageIds.push(message.messageId);
    }
  }

  let num = generateRandom5DigNum();
  while (allMessageIds.includes(num)) {
    num = generateRandom5DigNum();
  }

  return num;
};

const generateRandom5DigNum = () => Math.floor(Math.random() * Math.random() * 10000 + 10000);

const getUNIXTime = () => Math.floor(Date.now() / 1000);

const getIndexOfChannel = (channelId: number): number => {
  const data = getData();
  for (let i = 0; data.channels[i]; i++) {
    if (channelId === data.channels[i].id) {
      return i;
    }
  }
};

/* const getIndexOfDm = (dmId: number): number => {
  const data = getData();
  for (let i = 0; data.dmData[i]; i++) {
    if (dmId === data.dmData[i].dmId) {
      return i;
    }
  }
}; */

/* const isMessageSenderValid = (messageId: number, token: string) => {
  const data = getData();
  const uId = tokenToUId(token);
  let message;
  for (const channel of data.channelData) {
    message = channel.messages.find((message) => message.messageId === messageId);
  }
  if (message === undefined) {
    for (const dm of data.dmData) {
      message = dm.messages.find((message) => message.messageId === messageId);
    }
  }

  if (message.uId === uId) {
    return true;
  }
  return false;
}; */

/* const isAuthUserIdPermissionValid = (messageId: number, token: string) => {
  const data = getData();
  const uId = tokenToUId(token);

  let channelId;
  for (const channel of data.channelData) {
    for (const message of channel.messages) {
      if (message.messageId === messageId) {
        channelId = channel.channelId;
      }
    }
  }
  const channelIndex = getIndexOfChannel(channelId);
  for (const member of data.channelData[channelIndex].ownerMembers) {
    if (member.uId === uId) {
      return true;
    }
  }

  let dmId;
  for (const dm of data.dmData) {
    for (const message of dm.messages) {
      if (message.messageId === messageId) {
        dmId = dm.dmId;
      }
    }
  }
  const dmIndex = getIndexOfDm(dmId);
  if (uId === data.dmData[dmIndex].ownerMember.uId) {
    return true;
  }

  return false;
}; */

/* const isChannelMessage = (messageId: number) => {
  const data = getData();
  let isMessageChannel: boolean;
  for (const channel of data.channelData) {
    if (channel.messages.find((message) => message.messageId === messageId) !== undefined) {
      isMessageChannel = true;
    }
  }

  return !!isMessageChannel;
}; */

/* const getChannelMessageLocation = (messageId: number) => {
  const data = getData();
  for (let i = 0; i < data.channelData.length; i++) {
    for (let j = 0; j < data.channelData[i].messages.length; j++) {
      if (data.channelData[i].messages[j].messageId === messageId) {
        return {
          channelIndex: i,
          messageIndex: j,
        };
      }
    }
  }
}; */

/* const getDmMessageLocation = (messageId: number) => {
  const data = getData();
  for (let i = 0; i < data.dmData.length; i++) {
    for (let j = 0; j < data.dmData[i].messages.length; j++) {
      if (data.dmData[i].messages[j].messageId === messageId) {
        return {
          dmIndex: i,
          messageId: j,
        };
      }
    }
  }
}; */

const isValidDm = (dmId: number) => {
  const data = getData();
  for (const dm of data.dms) {
    if (dm.id === dmId) {
      return true;
    }
  }
  return false;
};

const isMemberOfDm = (token: string, dmId: number) => {
  const data = getData();
  const uId = tokenToUId(token);
  const dm = data.dms.find((dm) => dm.id === dmId);
  if (dm.members.find((member) => member.id === uId) !== undefined) {
    return true;
  }
  return false;
};

const checkStart = (channelId: number, start: number) => {
  const data = getData();
  for (const channel of data.channels) {
    if (channel.id === channelId) {
      return start < channel.messages.length;
    }
  }
};

const isUserMemberOfChannel = (token: string, channelId: number) => {
  const data = getData();
  const uId = tokenToUId(token);
  for (const channel of data.channels) {
    if (channel.id === channelId) {
      return channel.allMembers.find((member) => member.id === uId) !== undefined;
    }
  }
};

const isValidMessage = (token: string, messageId: number) => {
  const uId = tokenToUId(token);
  const data = getData();
  for (const channel of data.channels) {
    if (channel.allMembers.find((member) => member.id === uId) !== undefined) {
      if (channel.messages.find((message) => message.messageId === messageId) !== undefined) {
        return true;
      }
    }
  }
  for (const dm of data.dms) {
    if (dm.members.find((member) => member.id === uId)) {
      if (dm.messages.find((message) => message.messageId === messageId) !== undefined) {
        return true;
      }
    }
  }
  return false;
};

const isMessageSentByUser = (token: string, messageId: number) => {
  const uId = tokenToUId(token);
  const data = getData();
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (message.messageId === messageId) {
        return message.uId === uId;
      }
    }
  }
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (message.messageId === messageId) {
        return message.uId === uId;
      }
    }
  }
};

const isUserOwner = (token: string, messageId: number) => {
  const uId = tokenToUId(token);
  const data = getData();
  for (const channel of data.channels) {
    if (channel.messages.find((message) => message.messageId === messageId) !== undefined) {
      return channel.ownerMembers.find((member) => member.id === uId) !== undefined;
    }
  }
  for (const dm of data.dms) {
    if (dm.messages.find((message) => message.messageId === messageId) !== undefined) {
      return dm.owner.id === uId;
    }
  }
};

// throws a HTTP error with the specified message and picks code based on conditions specified
const throwError = (
  errors: { code: number, errorMessage: string }[],
  errorMessage: string,
  defaultCode?: number) => {
  // default error value
  let outputCode = 400;
  if (defaultCode !== undefined) outputCode = defaultCode;

  for (const error of errors) {
    if (error.errorMessage === errorMessage) outputCode = error.code;
  }
  throw HTTPError(outputCode, errorMessage);
};

const isValidUser = (uId: number) => {
  const data = getData();
  for (const user of data.users) {
    if (uId === user.id) {
      return {};
    }
  }
  throw HTTPError(400, 'uId does not refer to a valid user');
};

const isUserOnlyGlobalOwner = (uId: number, permissionId: number) => {
  const data = getData();
  let globalUserCount = 0;
  for (const user of data.users) {
    if (user.permission === 1) {
      globalUserCount++;
    }
  }
  const user = data.users.find((user) => user.id === uId);

  if (user.permission === 1 && permissionId === 2 && globalUserCount === 1) {
    throw HTTPError(400, 'This user is the only global owner and cannot be demoted to user');
  }
  return {};
};

const isPermissionIdValid = (permissionId: number) => {
  if (!(permissionId === 1 || permissionId === 2)) {
    throw HTTPError(400, 'PermissionId is invalid');
  }
  return {};
};

const userHasPermission = (uId: number, permissionId: number) => {
  const data = getData();
  const user = data.users.find((user) => user.id === uId);
  if (user.permission === permissionId) {
    throw HTTPError(400, 'User already has the permission');
  }
  return {};
};

const isAuthUserGlobalOwner = (token: string) => {
  const data = getData();
  const user = data.users.find((user) => user.id === tokenToUId(token));
  if (user.permission !== 1) {
    throw HTTPError(403, 'Authorised user is not a global owner');
  }
  return {};
};

const isOnlyGlobalOwner = (uId: number) => {
  const data = getData();
  let globalUserCount = 0;
  for (const user of data.users) {
    if (user.permission === 1) {
      globalUserCount++;
    }
  }
  const user = data.users.find((user) => user.id === uId);
  if (globalUserCount === 1 && user.permission === 1) {
    throw HTTPError(400, 'user is the only global owner');
  }
  return {};
};

export {
  clearV1,
  generateToken,
  validateToken,
  tokenToUId,
  validateChannel,
  validateUserMember,
  generateRandom5DigNum,
  generateMessageId,
  getUNIXTime,
  getIndexOfChannel,
  isValidDm,
  isMemberOfDm,
  checkStart,
  isUserMemberOfChannel,
  isValidMessage,
  isMessageSentByUser,
  isUserOwner,
  throwError,
  isValidUser,
  isUserOnlyGlobalOwner,
  isPermissionIdValid,
  userHasPermission,
  isAuthUserGlobalOwner,
  isOnlyGlobalOwner,
  SERVER_URL,
  SECRET
};
