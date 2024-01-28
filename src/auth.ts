// Authorisation file
// auth.ts
//
// The functions in this file handle authorisation
import { Error, getData, setData, Stats } from './dataStore';
import validator from 'validator';
import objectHash from 'object-hash';

const OWNER = 1;
const MEMBER = 2;

type AuthUserIdWrapper = {
  token: string,
  authUserId: number
};

export function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string): AuthUserIdWrapper | Error {
  if (!validator.isEmail(email)) return { error: 'invalid email' };
  if (password.length < 6) return { error: 'password is too short' };
  if (nameFirst.length === 0 || nameFirst.length >= 50) return { error: 'first name must be between 1 and 50 characters inclusive' };
  if (nameLast.length === 0 || nameLast.length >= 50) return { error: 'first name must be between 1 and 50 characters inclusive' };

  const data = getData();

  // if (data.users.find(user => user.email === email)) return { error: 'email already in use' };
  console.log(data);
  for (const user of data.users) {
    if (user.email === email) {
      return { error: 'email already in use' };
    }
  }

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
  const token = objectHash(user);

  data.users.push(user);
  console.log(data);

  setData(data);

  return { token, authUserId };
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
