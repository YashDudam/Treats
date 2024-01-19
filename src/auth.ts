// Authorisation file
// auth.js
//
// This program was first modified by James White (z5363399)
// on 7/06/2022
//
// The use of this file is not known yet
import { getData, setData } from './dataStore';
import validator from 'validator';
import { authUserIdType, errorType, userData, errorToken } from './types';
import { generateToken, SECRET, getUNIXTime } from './other';
import hash from 'object-hash';

// authLoginV1: This function returns a user if the entered
// email and password are valid
/* Arguments:
    email: string - valid email entered by user
    password: string - valid password entered by user
Return Value:
    Returns User Id (integer) if input is valid
*/
function authLoginV1(email: string, password: string): authUserIdType | errorType {
  const data = getData();
  const userData = data.userData;

  // checks for valid user and password then returns user

  for (const i of userData) {
    if (i.email === email) {
      if (i.password === hash(password + SECRET)) {
        return {
          token: generateToken(i.uId),
          authUserId: i.uId
        };
      }
    }
  }
  return { error: 'error' };
}

// authRegisterV1: This function registers a new user
/* Arguments:
    email: string - valid email entered by user
    password: string - valid password entered by user
    nameFirst: string - First name entered by user
    nameLast: string - Last name entered by user
Return Value:
    Returns New User Id (integer) if input is valid
*/
function authRegisterV1(email: string, password: string, nameFirst: string, nameLast: string) {
  const timeStamp = getUNIXTime();
  // checking for input errors
  if (!authRegInputErrors(email, password, nameFirst, nameLast)) {
    return { error: 'error' } as errorToken;
  }
  const data = getData();
  const userData = data.userData;

  // generate Id
  const newId = userData.length + 1;

  // create newUser
  const newUser: userData = {
    uId: newId,
    handleStr: generateHandle(nameFirst, nameLast),
    email: email,
    password: hash(password + SECRET),
    nameFirst: nameFirst,
    nameLast: nameLast,
    permission: userData.length === 0 ? 1 : 2,
    userStats: {
      channelsJoined: [
        {
          numChannelsJoined: 0,
          timeStamp: timeStamp,
        },
      ],
      dmsJoined: [
        {
          numDmsJoined: 0,
          timeStamp: timeStamp,
        },
      ],
      messagesSent: [
        {
          numMessagesSent: 0,
          timeStamp: timeStamp,
        },
      ],
    }
  };

  // check if new user is the first to apply owner permission
  // otherwise apply member permission

  addNewUser(newUser);

  const token = generateToken(newUser.uId);

  return { authUserId: newId, token: token } as authUserIdType;
}

// authRegInputErrors: This function checks for input errors in authRegisterV1
function authRegInputErrors(email: string, password: string, nameFirst: string, nameLast: string) {
  if (!validator.isEmail(email)) {
    return false;
  } else if (password.length < 6) {
    return false;
  } else if (nameFirst.length < 1 || nameFirst.length > 50) {
    return false;
  } else if (nameLast.length < 1 || nameLast.length > 50) {
    return false;
  }

  const data = getData();
  const userData = data.userData;

  for (const i of userData) {
    if (i.email === email) {
      return false;
    }
  }

  return true;
}

// generateHandle: This function generates a new handle in the authRegisterV1 function
function generateHandle(nameFirst: string, nameLast: string) {
  let handle = nameFirst + nameLast;
  handle = handle.toLowerCase();
  handle = handle.replace(/[^a-z0-9]+/g, '');
  handle = handle.slice(0, 20);

  const data = getData();
  const userData = data.userData;
  let largestHandle: number | string = -1;
  let handleNum: number | string = -1;

  // check if there are handle duplicates
  // if there are, increase the handle number by one and add to end of handle
  for (const i of userData) {
    const handleCompare = i.handleStr.slice(0, handle.length);
    if (handleCompare === handle) {
      handleNum = i.handleStr.slice(handle.length, 25);
      handleNum = parseInt(handleNum as string);
      if (handleNum > largestHandle) {
        largestHandle = handleNum;
      }
    }
  }

  if (largestHandle === -1 && isNaN(handleNum)) {
    largestHandle = '0';
  } else if (largestHandle > -1) {
    largestHandle++;
    largestHandle = largestHandle.toString();
  } else {
    largestHandle = '';
  }

  handle = handle + largestHandle;
  return handle;
}

// compareAuthUserId: This function is used to order the datastore by authUserId
function compareAuthUserId(a: any, b: any) {
  return a.authUserId - b.authUserId;
}

// addNewUser: This function adds a new user to the datastore and orders the store
function addNewUser(newUser: any) {
  const data = getData();
  const userData = data.userData;
  userData.push(newUser);

  // sorts the user data array
  userData.sort(compareAuthUserId);

  data.userData = userData;
  setData(data);
}

// export function validateHandle(handle: string) {
//   const data = getData();
//   const userData = data.userData;
//   let largestHandle: number | string = -1;
//   let handleNum: number | string = -1;

//   for (const i of userData) {
//     const handleCompare = i.handleStr.slice(0, handle.length);
//     if (handleCompare === handle) {
//       handleNum = i.handleStr.slice(handle.length, 25);
//       handleNum = parseInt(handleNum);
//       if (handleNum > largestHandle) {
//         largestHandle = handleNum;
//       }
//     }
//   }
//   if (largestHandle === -1 && isNaN(handleNum)) {
//     largestHandle = '0';
//   } else if (largestHandle > -1) {
//     largestHandle++;
//     largestHandle = largestHandle.toString();
//   } else {
//     largestHandle = '';
//   }
//   handle = handle + largestHandle;
//   return handle;
// }

export { authLoginV1, authRegisterV1 };
