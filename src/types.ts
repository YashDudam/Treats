// A file that contains all type definitions
type channelJoined = {
  numChannelsJoined: number,
  timeStamp: number,
};

type dmJoined = {
  numDmsJoined: number,
  timeStamp: number,
}

type messageSent = {
  numMessagesSent: number,
  timeStamp: number,
}

type userStats = {
  channelsJoined: channelJoined[],
  dmsJoined: dmJoined[],
  messagesSent: messageSent[],
};

type userStatsV1return = {
  channelsJoined: channelJoined[],
  dmsJoined: dmJoined[],
  messagesSent: messageSent[],
  involvementRate: number,
}

type userData = {
  uId: number,
  handleStr: string,
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  permission: number,
  userStats: userStats,
};

type member = {
  uId: number,
  handleStr: string,
  nameLast: string,
  nameFirst: string,
  email: string,
};

type message = {
  messageId: number,
  uId: number,
  message: string,
  timeSent: number,
};

type dmData = {
  name: string,
  dmId: number,
  ownerMember: member,
  members: member[],
  messages: message[]
};

type standupMessage = {
  userHandle: string,
  message: string,
};

type standup = {
  isActive: boolean,
  timeFinish: number,
  standupMessages: standupMessage[],
};

type channelData = {
  channelId: number,
  channelName: string,
  isPublic: boolean,
  ownerMembers: member[],
  allMembers: member[],
  messages: message[],
  standup: standup,
};

type token = {
  token: string,
  authUserId: number,
};

interface Data {
  userData: userData[],
  channelData: channelData[],
  userTokens: token[],
  dmData: dmData[],
}

type errorType = {
  error: string
};

type HTTPErrorType = {
  error: {code: number, message: string}
};

type standupStartReturn = {
  timeFinish: number
}

type standupActiveReturn = {
  isActive: boolean,
  timeFinish: number
}

type errorToken = {
  token: string,
  authUserId: number,
  error: string
}

type channelMessages = {
  messages: message[],
  start: number,
  end: number,
};

type channelDetailType = {
  name: string,
  isPublic: boolean,
  ownerMembers: member[],
  allMembers: member[]
};

// TODO: make token non-optional when auth.ts functions are done
type authUserIdType = {
  token?: string,
  authUserId: number
};

type channelIdType = { channelId: number };

type dmIdType = { dmId: number };

type messageIdType = { messageId: number };

type emptyType = Record<string, never>;

type channelsList = {
  channelId: number,
  name: string,
};

type channelsListFn = { channels: channelsList[] };

type dmListType = {
  dmId: number,
  name: string
}

type dmDetailType = {
  name: string,
  members: member[]
}

type dmMessages = {
  messages: message[],
  start: number,
  end: number
}

type requestMessageSendV1Return = {
  result: messageIdType | errorType,
  statusCode: number,
}

export {
  Data,
  userData,
  channelData,
  dmData,
  token,
  member,
  message,
  errorType,
  channelMessages,
  channelDetailType,
  authUserIdType,
  channelIdType,
  dmIdType,
  messageIdType,
  emptyType,
  channelsList,
  dmListType,
  dmDetailType,
  dmMessages,
  channelsListFn,
  errorToken,
  requestMessageSendV1Return,
  userStatsV1return,
  standup,
  standupMessage,
  HTTPErrorType,
  standupStartReturn,
  standupActiveReturn,
};