// Authorisation file
// auth.ts
//
// The functions in this file handle authorisation
import { Error, getData, setData, Stats } from './dataStore';
import validator from 'validator';
import hash from 'object-hash';

const OWNER = 1;
const MEMBER = 2;
const SECRET = 'YashHariLeonJamesEugeneCRUNCHIE';

type AuthUserIdWrapper = {
  token: string,
  authUserId: number
};

/**
 * logins to a registered user
 *    @param email
 *    @param password
 *  @returns
 *    email doesn't belong to user  { error }
 *    password is incorrect         { error }
 *    on success                    { token, authUserId }
 **/
export function authLoginV3(email: string, password): AuthUserIdWrapper | Error {
  const data = getData();

  const user = data.users.find(user => user.email === email);

  if (user === undefined) {
    return { error: 'email does not belong to a user' };
  }

  if (user.password !== password) {
    return { error: 'incorrect password' };
  }

  return {
    token: generateToken(),
    authUserId: user.id
  };
}

/**
 * registers a user in the database
 *    @param email      valid email
 *    @param password   must be greater than 6 characters
 *    @param nameFirst  must be between 1 and 50 characters inclusive
 *    @param nameLast   must be between 1 and 50 characters inclusive
 *    @returns
 *        { token, authUserId }
 **/
export function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string): AuthUserIdWrapper | Error {
  if (!validator.isEmail(email)) return { error: 'invalid email' };
  if (password.length < 6) return { error: 'password is too short' };
  if (nameFirst.length === 0 || nameFirst.length >= 50) return { error: 'first name must be between 1 and 50 characters inclusive' };
  if (nameLast.length === 0 || nameLast.length >= 50) return { error: 'first name must be between 1 and 50 characters inclusive' };

  const data = getData();

  if (data.users.find(user => user.email === email)) return { error: 'email already in use' };

  const authUserId = data.users.length + 1;
  const user = {
    id: authUserId,
    handle: generateHandle(nameFirst, nameLast),
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    password: password,
    permission: data.users.length === 0 ? OWNER : MEMBER,
    stats: initUserStats()
  };
  const token = generateToken();

  data.users.push(user);
  data.tokens.push({ token, authUserId });

  setData(data);

  return { token, authUserId };
}

// vulnerable to hash collisions because it doesn't check that a token has been taken
function generateToken() {
  return hash(Math.random().toString() + SECRET);
}

function generateHandle(nameFirst: string, nameLast: string): string {
  const handle = (nameFirst + nameLast).toLowerCase().replace(/[^a-z0-9]/gi, '');

  const data = getData();
  if (!data.users.find(user => user.handle === handle)) {
    return handle;
  }

  let i = 0;
  while (data.users.find(user => user.handle === handle + i) !== undefined) {
    i++;
  }

  return handle + i;
}

function initUserStats(): Stats {
  const numChannelsJoined = 0;
  const numDmsJoined = 0;
  const numMessagesSent = 0;
  const timeStamp = Math.floor((new Date()).getTime() / 1000);

  return {
    channelsJoined: [{ numChannelsJoined, timeStamp }],
    dmsJoined: [{ numDmsJoined, timeStamp }],
    messagesSent: [{ numMessagesSent, timeStamp }],
  };
}
