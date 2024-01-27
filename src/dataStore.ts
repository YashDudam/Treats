// YOU SHOULD MODIFY THIS OBJECT BELOW
import fs from 'fs';

export type ChannelJoined = {
  numChannelsJoined: number;
  timeStamp: number;
};

export type DmJoined = {
  numDmsJoined: number;
  timeStamp: number;
};

export type MessageSent = {
  numMessagesSent: number;
  timeStamp: number;
};

export type UserStats = {
  channelsJoined: ChannelJoined[];
  dmsJoined: DmJoined[];
  messagesSent: MessageSent[];
};

export type User = {
  id: number;
  handle: string;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  permission: number;
  userStats: UserStats;
};

export type Member = {
  id: number;
  handle: string;
  nameLast: string;
  nameFirst: string;
  email: string;
};

export type Message = {
  messageId: number;
  uId: number;
  message: string;
  timeSent: number;
};

export type Dm = {
  name: string;
  id: number;
  owner: Member;
  members: Member[];
  messages: Message[];
};

export type StandupMessage = {
  userHandle: string;
  message: string;
};

export type Standup = {
  isActive: boolean;
  timeFinish: number;
  standupMessages: StandupMessage[];
};

export type Channel = {
  id: number;
  name: string;
  isPublic: boolean;
  ownerMembers: Member[];
  allMembers: Member[];
  messages: Message[];
  standup: Standup;
};

export type Token = {
  token: string;
  authUserId: number;
};

export type Data = {
  users: User[];
  channels: Channel[];
  tokens: Token[];
  dms: Dm[];
};

export type Empty = Record<string, never>;

export type Error = {
  error: string
};
// Use getData() to access the data
export function getData(): Data {
  return JSON.parse(String(fs.readFileSync('dataStore.json', { flag: 'r' })));
}

// Use setData(newData) to pass in the entire data object, with modifications made
export function setData(data: Data) {
  fs.writeFileSync('dataStore.json', JSON.stringify(data), { flag: 'w' });
}

export function clear() {
  setData({
    users: [],
    channels: [],
    tokens: [],
    dms: []
  });
}
