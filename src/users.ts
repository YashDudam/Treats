// Leonidas Kapaniris, z5359385 19/06
import { getData, setData } from './dataStore';
import { tokenToUId, isValidUser } from './other';
import validator from 'validator';
import { emptyType, errorType, member, userStatsV1return } from './types';
// import {validate_handle} from './auth' //'./auth.ts' when the conversion happens

/*
* @param {Number} authUserId = the user's id who is making the request
* @param {Number} uId = the id of the user who's details are going to be returned
* @returns {object} user = object containing the details about the user
* @returns {error: 'error'} if authUserId or uId are not valid
*/
//
// * @param {Number} authUserId = the user's id who is making the request
// * @param {Number} uId = the id of the user who's details are going to be returned
// * @returns {object} user = object containing the details about the user
// * @returns {error: 'error'} if authUserId or uId are not valid
//
// Funciton that lists the deatuls about the users
// export function userProfileV1(authUserId: number, uId: number): member | errorType {
//   // Creating the checks to see if both the authUserId and the uId are valid
//   let authUserIdCheck = false;
//   let uIdCheck = false;
//   const datastore = getData();
//   let user: member;
//   // check for the authUserId and uId
//   for (let i = 0; i < datastore.userData.length; i++) {
//     if (authUserId === datastore.userData[i].uId) {
//       authUserIdCheck = true;
//       user = datastore.userData[i];
//     }
//     if (uId === datastore.userData[i].uId) {
//       uIdCheck = true;
//     }
//   }
//   if (uIdCheck && authUserIdCheck) {
//     return {
//       uId: user.uId,
//       nameFirst: user.nameFirst,
//       nameLast: user.nameLast,
//       handleStr: user.handleStr,
//       email: user.email
//     };
//   } else {
//     return { error: 'error' };
//   }
// }

//
// * @param {String} token = the token who is making the request
// * @param {Number} uId = the id of the user who's details are going to be returned
// * @returns {object} user = object containing the details about the user
// * @returns {error: 'error'} if authUserId or uId are not valid
//
// Funciton that lists the deatuls about the users
export const userProfileV2 = (token : string, uId : number): object | errorType => {
  // Creating the checks to see if the uId is valid
  let uIdCheck = false; // uId wanting to get
  const datastore = getData();
  let user: member;
  // check for the authUserId and uId

  for (let i = 0; i < datastore.userData.length; i++) {
    if (uId === datastore.userData[i].uId) {
      uIdCheck = true;
      user = datastore.userData[i];
    }
  }
  if (uIdCheck) {
    const returnUser : member = {
      uId: user.uId,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr,
      email: user.email
    };
    return { user: returnUser };
  } else {
    return { error: 'error' };
  }
};
// Changed the return type

// Written by Leonidas Kapaniris z5359385 8/7/2022
// specs say it returns an object but it's weird its like an object
// holding an array holding object
// {users: [
//     user1: {}
//     user2: {}
// ]}
// @param {string} token = the token of the user making the request
// @returns {object} users = an object containing an array of users in a compressed format
export const usersViewAllV1 = (): object => {
  const data = getData();
  const detail = data.userData;
  const userArray = [];
  for (let i = 0; i < detail.length; ++i) {
    const user = compressedUser();
    user.uId = detail[i].uId;
    user.nameFirst = detail[i].nameFirst;
    user.nameLast = detail[i].nameLast;
    user.handleStr = detail[i].handleStr;
    user.email = detail[i].email;

    userArray.push(user);
  }
  return { users: userArray };
};

// helper function that returns an empty user
// @params {}
// @returns {object} of type member
function compressedUser() : member {
  return {
    uId: -1,
    nameFirst: '',
    nameLast: '',
    handleStr: '',
    email: ''
  };
}

// uses the token_to_uId function which returns the uId given the token
/*
*@param {String} token = a string containing a unique token matching a uId to a session
*@param {String} nameFirst = a string that is going to be the new first name of the user
*@param {String} nameLast = a string that is goint to be the new last name of the user
*@returns {object} {} = an empty object as per the specs
*/
export const userSetNameV1 = (
  token: string,
  nameFirst: string,
  nameLast: string
): emptyType | errorType => {
  const dataStore = getData();
  const uId = tokenToUId(token); // returns the uId
  if (nameFirst.length < 1 || nameFirst.length > 50 || nameLast.length < 1 || nameLast.length > 50) {
    return { error: 'Invalid name length' };
  }
  for (let i = 0; i < dataStore.userData.length; ++i) {
    if (uId === dataStore.userData[i].uId) {
      dataStore.userData[i].nameFirst = nameFirst;
      dataStore.userData[i].nameLast = nameLast;
      setData(dataStore);
      return {};
    }
  }
  // Unreachable
  // return { error: 'error' };
};

/*
*@param {String} token = a string containing a unique token matching a uId to a session
*@param {String} email = a string that is going to be the new email of the user
*@returns {object} {} = an empty object as per the specs
*/
export const userSetEmailV1 = (token: string, email: string): emptyType | errorType => {
  const dataStore = getData();
  const uId = tokenToUId(token); // returns the uId

  // checks if the email is correct
  if (!validator.isEmail(email)) return { error: 'Invalid email' };
  if (checkEmailExist(email)) return { error: 'Email already exists' };

  for (let i = 0; i < dataStore.userData.length; ++i) {
    if (uId === dataStore.userData[i].uId) {
      dataStore.userData[i].email = email;
      setData(dataStore);
      return {};
    }
  }
  // Unreachable
  // return { error: 'error' };
};

/*
*@param {String} token = a string containing a unique token matching a uId to a session
*@param {String} handleStr = a string that is going to be the new handleStr of the user
*@returns {object} {} = an empty object as per the specs
*/
export const userSetHandleStrV1 = (token: string, handleStr: string): emptyType | errorType => {
  const dataStore = getData();
  const uId = tokenToUId(token); // returns the uIdd

  // Validation
  if (handleStr.length < 3) return { error: 'Handle is too short' };
  if (handleStr.length > 20) return { error: 'Handle is too long' };
  // https://bobbyhadz.com/blog/javascript-check-if-string-contains-only-letters-and-numbers
  if (!/^[A-Za-z0-9]*$/.test(handleStr)) {
    return { error: 'Handle includes non alphanumeric characters' };
  }

  // console.log(dataStore, "Hehe")
  // console.log(token, handleStr, uId)
  for (let i = 0; i < dataStore.userData.length; ++i) {
    if (uId === dataStore.userData[i].uId) {
      dataStore.userData[i].handleStr = handleStr;
      setData(dataStore);
      return {};
    }
  }
  // Unreachable
  // return { error: 'error' };
};

// returns true if it exists, false if not
/*
*@param {String} email = the email in question
*@return {Boolean} = true if the email exists, false if it does not
*/
export const checkEmailExist = (email: string): boolean => {
  const data = getData();
  for (let i = 0; i < data.userData.length; ++i) {
    if (email === data.userData[i].email) {
      return true;
    }
  }
  return false;
};

export const userStatsV1 = (token: string) => {
  const uId = tokenToUId(token) as number;
  isValidUser(uId);

  const userStats: userStatsV1return = {
    channelsJoined: [],
    dmsJoined: [],
    messagesSent: [],
    involvementRate: 0,
  };
  const data = getData();
  for (const user of data.userData) {
    if (user.uId === uId) {
      userStats.channelsJoined = user.userStats.channelsJoined;
      userStats.dmsJoined = user.userStats.dmsJoined;
      userStats.messagesSent = user.userStats.messagesSent;
    }
  }
  const numChannelsJoined = userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined;
  const numDmsJoined = userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined;
  const numMessagesSent = userStats.messagesSent[userStats.messagesSent.length - 1].numMessagesSent;
  const numChannels = data.channelData.length;
  const numDms = data.dmData.length;
  let numMessages = 0;
  for (const channel of data.channelData) {
    numMessages += channel.messages.length;
  }
  for (const dm of data.dmData) {
    numMessages += dm.messages.length;
  }

  if (numChannels + numDms + numMessages === 0) {
    return { userStats };
  }
  const rate = (numChannelsJoined + numDmsJoined + numMessagesSent) / (numChannels + numDms + numMessages);
  userStats.involvementRate = rate;
  return { userStats };
};
