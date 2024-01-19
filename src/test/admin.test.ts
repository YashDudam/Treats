import {
  requestAdminUserpermissionChange,
  requestAdminUserRemove,
  requestAuthRegister,
  requestChannelInvite,
  requestChannelsCreate,
  requestClear,
  requestDmCreate,
  requestMessageSend,
  requestMessageSendDm
} from "../requests";


const OK = 200;
const BAD = 400;
const FORBIDDEN = 403;

describe('admin/userpermission/change/v1', () => {
  beforeEach(() => {
    requestClear();
  });
  afterEach(() => {
    requestClear();
  });

  test('error case, uId does not refer to a valid case', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xbcmnvb', 'anakin', 'skywalker');
    requestAuthRegister('kenobi@gmail.com', 'qertuyp', 'obiwan', 'kenobi');
    const result = requestAdminUserpermissionChange(anakin.token, -7385, 1);
    expect(result.statusCode).toStrictEqual(BAD);
  });

  test('error case, uId refers to a user that is the only global owner', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xbcmnvb', 'anakin', 'skywalker');
    requestAuthRegister('kenobi@gmail.com', 'qertuyp', 'obiwan', 'kenobi');
    const result = requestAdminUserpermissionChange(anakin.token, anakin.authUserId, 2)
    expect(result.statusCode).toStrictEqual(BAD);
  });

  test('error case, invalid permissionId', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xbcmnvb', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'qertuyp', 'obiwan', 'kenobi');
    const result = requestAdminUserpermissionChange(anakin.token, kenobi.authUserId, 69);
    expect(result.statusCode).toStrictEqual(BAD);
  });

  test('error case, user already has the permission', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xbcmnvb', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'qertuyp', 'obiwan', 'kenobi');
    const result = requestAdminUserpermissionChange(anakin.token, kenobi.authUserId, 2);
    expect(result.statusCode).toStrictEqual(BAD);
  });

  test('error case, user is not a global owner', () => {
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'qertuyp', 'obiwan', 'kenobi');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'xcnvbxmcbv', 'sheev', 'palpatine');
    requestAdminUserpermissionChange(kenobi.token, palpatine.authUserId, 1);
    const anakin = requestAuthRegister('anakin@gmail.com', 'xbcmnvb', 'anakin', 'skywalker');
    const result = requestAdminUserpermissionChange(anakin.token, kenobi.authUserId, 2);
    expect(result.statusCode).toStrictEqual(FORBIDDEN);
  });

  test('success case', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xbcmnvb', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'qertuyp', 'obiwan', 'kenobi');
    const result = requestAdminUserpermissionChange(anakin.token, kenobi.authUserId, 1);
    expect(result.data).toStrictEqual({});
    expect(result.statusCode).toStrictEqual(OK);
  });
});

describe('admin/user/remove/v1', () => {
  beforeEach(() => {
    requestClear();
  });
  afterEach(() => {
    requestClear();
  });

  test('error case, invalid uId', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xcvbxcv', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'euwyrt', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(anakin.token, 'Da Boys', false);
    requestChannelInvite(anakin.token, channel.channelId, palpatine.authUserId);
    requestMessageSend(anakin.token, channel.channelId, 'Hello there');
    requestMessageSend(anakin.token, channel.channelId, 'Hellooooooo');
    requestMessageSend(anakin.token, channel.channelId, 'Nvm I guess');
    const result = requestAdminUserRemove(anakin.token, -4567);
    expect(result.statusCode).toStrictEqual(BAD);
  });

  test('error case, uId refers to global owner', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xcvbxcv', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'euwyrt', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(anakin.token, 'Da Boys', false);
    requestChannelInvite(anakin.token, channel.channelId, palpatine.authUserId);
    requestMessageSend(anakin.token, channel.channelId, 'Hello there');
    requestMessageSend(anakin.token, channel.channelId, 'Hellooooooo');
    requestMessageSend(anakin.token, channel.channelId, 'Nvm I guess');
    const result = requestAdminUserRemove(anakin.token, anakin.authUserId);
    expect(result.statusCode).toStrictEqual(BAD);
  });

  test('error case, user is not a global owner', () => {
    // need to clarify this error case, is there a way to have more than one global owner? 
    const anakin = requestAuthRegister('anakin@gmail.com', 'xcvbxcv', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'euwyrt', 'sheev', 'palpatine');
    const kenobi = requestAuthRegister('obi@gmail.com', 'xcmnvbmnxzbc', 'obiwan', 'kenobi');
    const channel = requestChannelsCreate(anakin.token, 'Da Boys', false);
    requestChannelInvite(anakin.token, channel.channelId, palpatine.authUserId);
    requestMessageSend(anakin.token, channel.channelId, 'Hello there');
    requestMessageSend(anakin.token, channel.channelId, 'Hellooooooo');
    requestMessageSend(anakin.token, channel.channelId, 'Nvm I guess');
    requestAdminUserpermissionChange(anakin.token, kenobi.authUserId, 1);
    const result = requestAdminUserRemove(palpatine.token, anakin.authUserId);
    expect(result.statusCode).toStrictEqual(FORBIDDEN);
  });

  test('success case 1', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xcvbxcv', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'euwyrt', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(anakin.token, 'Da Boys', false);
    requestChannelInvite(anakin.token, channel.channelId, palpatine.authUserId);
    requestMessageSend(anakin.token, channel.channelId, 'Hello there');
    requestMessageSend(anakin.token, channel.channelId, 'Hellooooooo');
    requestMessageSend(anakin.token, channel.channelId, 'Nvm I guess');
    const dm = requestDmCreate(anakin.token, [palpatine.authUserId]).data;
    requestMessageSendDm(anakin.token, dm.dmId, 'Hello there')
    requestMessageSendDm(anakin.token, dm.dmId, 'Hello again')
    requestMessageSendDm(anakin.token, dm.dmId, 'Hello?')
    const result = requestAdminUserRemove(anakin.token, palpatine.authUserId);
    expect(result.data).toStrictEqual({});
    expect(result.statusCode).toStrictEqual(OK);
  });
  
  test('success case 2', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xcvbxcv', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'euwyrt', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(anakin.token, 'Da Boys', false);
    requestChannelInvite(anakin.token, channel.channelId, palpatine.authUserId);
    requestMessageSend(palpatine.token, channel.channelId, 'Hello there');
    requestMessageSend(palpatine.token, channel.channelId, 'Hellooooooo');
    requestMessageSend(palpatine.token, channel.channelId, 'Nvm I guess');
    const dm = requestDmCreate(anakin.token, [palpatine.authUserId]).data;
    requestMessageSendDm(palpatine.token, dm.dmId, 'Hello there')
    requestMessageSendDm(palpatine.token, dm.dmId, 'Hello again')
    requestMessageSendDm(palpatine.token, dm.dmId, 'Hello?')
    const result = requestAdminUserRemove(anakin.token, palpatine.authUserId);
    expect(result.data).toStrictEqual({});
    expect(result.statusCode).toStrictEqual(OK);
  });
});

