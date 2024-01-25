// A file that contains all type definitions

type HTTPErrorType = {
  error: { code: number, message: string }
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
