import {
  requestAuthRegister, requestChannelInvite, requestChannelsCreate,
  requestClear, requestDmCreate, requestMessageEdit, requestMessageRemove,
  requestMessageSendDm, requestMessageSend
} from "../requests";
import { SERVER_URL } from "../other";
import { authUserIdType, dmIdType, messageIdType } from "../types";
import request from "sync-request";

describe('message/send/v2', () => {
  beforeEach(() => {
    requestClear();
  });

  test('Invalid channelId', () => {
    const user = requestAuthRegister('anakin.skywalker@gmail.com', '5ITHLORD4LIFE', 'Anakin', 'Skywalker');
    requestChannelsCreate(user.token, 'Sith lordz', false);
    const obj = requestMessageSend(user.token, -234, 'Welcome to the meeting everyone!');
    expect(obj.statusCode).toEqual(400);
  });

  test('Invalid message length', () => {
    const user = requestAuthRegister('anakin.skywalker@gmail.com', '5ITHLORD4LIFE', 'Anakin', 'Skywalker');
    const channel = requestChannelsCreate(user.token, 'Sith lordz', false);
    // message too short
    let obj = requestMessageSend(user.token, channel.channelId, '');
    expect(obj.statusCode).toEqual(400);
    // message too long
    let message = 'uvuvwevwevwe onyetenyevwe ugwemubwem ossas';
    for (let i = 0; i < 25; i++) {
      message += 'uvuvwevwevwe onyetenyevwe ugwemubwem ossas';
    }
    obj = requestMessageSend(user.token, channel.channelId, message);
    expect(obj.statusCode).toEqual(400);
  });

  test('User is not a member of the channel', () => {
    const userOne = requestAuthRegister('anakin.skywalker@gmail.com', '5ITHLORD4LIFE', 'Anakin', 'Skywalker');
    const userTwo = requestAuthRegister('obiwan.kenobi@gmail.com', 'H1GHGROUND', 'Obi-Wan', 'Kenobi');
    const channel = requestChannelsCreate(userOne.token, 'Sith lordz', false);
    const obj = requestMessageSend(userTwo.token, channel.channelId, 'Hello there, I too am a Sith lord');
    expect(obj.statusCode).toEqual(403);
  });

  test('Sending one message)', () => {
    const user = requestAuthRegister('anakin.skywalker@gmail.com', '5ITHLORD4LIFE', 'Anakin', 'Skywalker');
    const channel = requestChannelsCreate(user.token, 'The Jedi Council', true);
    const obj = requestMessageSend(user.token, channel.channelId, 'Hello? You guys there?');
    expect(obj.statusCode).toEqual(200);
    expect(JSON.parse(obj.getBody() as string)).toStrictEqual({ messageId: expect.any(Number) });
  });

  test('Sending multiple messages)', () => {
    const user = requestAuthRegister('anakin.skywalker@gmail.com', '5ITHLORD4LIFE', 'Anakin', 'Skywalker');
    const channel = requestChannelsCreate(user.token, 'The Jedi Council', true);

    const objOne = requestMessageSend(user.token, channel.channelId, 'Hello? You guys there?');
    expect(objOne.statusCode).toEqual(200);
    expect(JSON.parse(objOne.getBody() as string)).toStrictEqual({ messageId: expect.any(Number) });

    const objTwo = requestMessageSend(user.token, channel.channelId, '...just gonna chill here...');
    expect(objTwo.statusCode).toEqual(200);
    expect(JSON.parse(objTwo.getBody() as string)).toStrictEqual({ messageId: expect.any(Number) });

    const objThree = requestMessageSend(user.token, channel.channelId, '...man senator Palpatine is so nice');
    expect(objThree.statusCode).toEqual(200);
    expect(JSON.parse(objThree.getBody() as string)).toStrictEqual({ messageId: expect.any(Number) });
  });
});

describe('message/senddm/v2', () => {

  let user: authUserIdType,
  globalUser: authUserIdType,
  anotherUser: authUserIdType,
  dm: dmIdType

  beforeEach(() => {
    // Clear data
    request('DELETE', SERVER_URL + '/clear/v1');

    // Add new users
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
          email: 'itsallaroundus@outlook.com',
          password: 'midichlorians100',
          nameFirst: 'The',
          nameLast: 'Force'
        }),
        headers: {
          'content-type': 'application/json'
        }
      }
    );
    globalUser = JSON.parse(res.getBody() as string);

    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
          email: 'justasenator@gmail.com',
          password: 'palp@t1ne',
          nameFirst: 'Darth',
          nameLast: 'Sidious'
        }),
        headers: {
          'content-type': 'application/json'
        }
      }
    );
    user = JSON.parse(res.getBody() as string);

    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
          email: 'chosenone@hotmail.com',
          password: 'darkside123',
          nameFirst: 'Darth',
          nameLast: 'Vader'
        }),
        headers: {
          'content-type': 'application/json'
        }
      }
    );
    anotherUser = JSON.parse(res.getBody() as string);

    // Create dm
    res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [anotherUser.authUserId]
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    dm = JSON.parse(res.getBody() as string);
  });

  test('Invalid token', () => {
    let res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: 'Do you wanna build a snowman?'
        }),
        headers: { 
          'content-type': 'application/json',
          'token': '@#$*(@'
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Invalid dmId', () => {
    let res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: -9405498,
          message: 'Do you wanna build a snowman?'
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);
  });

  test('Invalid message', () => {
    // Message is too short
    let res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: ''
        }),
        headers: { 
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);

    // Message is too long
    let superLongMessage = '';
    for (let i = 0; i < 34; i++) {
      // 30 char message, 30 * 34 > 1000
      superLongMessage = superLongMessage + 'uvuvwevwevwe onyetenyevwe ugwemubwem ossas';
    }

    res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: superLongMessage
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);
  });

  test('User is not a member of the dm', () => {
    // Message is too short
    let res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: 'Not a good idea mate!'
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      } 
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Success', () => {
    // Message is too short
    let res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: 'Do it.'
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toEqual({ messageId: expect.any(Number) });
  });
});

describe('message/edit/v2', () => {
  beforeEach(() =>{
    requestClear();
  });

  test('Message is longer than 1000 characters (channel)', () => {
    const user = requestAuthRegister('anakin@gmail.com', 'asdflkjfjajk', 'anakin', 'skywalker');
    const channel = requestChannelsCreate(user.token, 'High ground', false);
    const buffer = requestMessageSend(user.token, channel.channelId, 'All you gotta do is jump really really high');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    let longMessage = '';
    for (let i = 0; i < 1001; i++) {
      longMessage = longMessage + 'a';
    }
    const result = requestMessageEdit(user.token, message.messageId, longMessage);
    expect(result.statusCode).toEqual(400);
  });
  
  test('Message is longer than 1000 characters (dm)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'asdflkjfjajk', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'mmmmmevilgood', 'sheev', 'palpatine');
    const temp = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = temp.data as dmIdType;
    const buffer = requestMessageSendDm(palpatine.token, dm.dmId, 'Did you ever hear the tragedy of Darth Plagueis the wise?');
    const message = buffer.data as messageIdType;
    let longMessage = '';
    for (let i = 0; i < 1001; i++) {
      longMessage = longMessage + 'a';
    }
    const result = requestMessageEdit(palpatine.token, message.messageId, longMessage);
    expect(result.statusCode).toEqual(400);
  });

  test('MessageId does not refer to a valid message within the channel the user is a member of', () => {
    const user = requestAuthRegister('anakin@gmail.com', 'asdflkjfjajk', 'anakin', 'skywalker');
    const channel = requestChannelsCreate(user.token, 'High ground', false);
    requestMessageSend(user.token, channel.channelId, 'Hello there');
    requestMessageSend(user.token, channel.channelId, '...uhhhhh guys?');
    requestMessageSend(user.token, channel.channelId, 'Okay then guess imma dip then');
    const result = requestMessageEdit(user.token, -596, 'Okay this is too sad guys cmon');
    expect(result.statusCode).toEqual(400);
  });

  test('MessageId does not refer to a valid message within the channels the user is a member of' , () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'asdflkjfjajk', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'aksgdfha', 'obi-wan', 'kenobi');
    const channel = requestChannelsCreate(anakin.token, 'High ground', false);
    requestChannelsCreate(kenobi.token, 'Joe mama', true);
    requestMessageSend(anakin.token, channel.channelId, 'Hello there');
    requestMessageSend(anakin.token, channel.channelId, 'Welcome to our very important seminar today');
    const buffer = requestMessageSend(anakin.token, channel.channelId, 'Today we will go over the high ground and how to beat it');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    const result = requestMessageEdit(kenobi.token, message.messageId, 'You simply cannot beat the high ground');
    expect(result.statusCode).toEqual(400);
  });

  test('MessageId does not refer to a valid message within the dm the user is a member of', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'sadfhasdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'asdkjfhalksd', 'sheev', 'palpatine');
    const buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = buffer.data as dmIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'Dewit');
    const result = requestMessageEdit(palpatine.token, -879, "Actually, don't dewit");
    expect(result.statusCode).toEqual(400);
  });

  test('MessageId does not refer to a valid message within the dms the user is a member of', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'sadfhasdfg', 'anakin', 'skywalker');
    const padme = requestAuthRegister('padme@gmail.com', 'adsgakdsfg', 'padme', 'amidala');
    requestDmCreate(anakin.token, [padme.authUserId]);
    const yoda = requestAuthRegister('yoda@gmail.com', 'rehjgreh', 'yoda', 'idunno');
    const quiGon = requestAuthRegister('qui-gon@gmail.com', 'qwerqqwq', 'Qui-gon', 'Jinn');
    const maceWindu = requestAuthRegister('macewindu@gmail.com', 'x4234bcvx', 'Mace', 'Windu');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'asdjkfaskdf', 'obi-wan', 'kenobi');
    const buffer = requestDmCreate(yoda.token, [quiGon.authUserId, maceWindu.authUserId, kenobi.authUserId]);
    const dm = buffer.data as dmIdType;
    const temp = requestMessageSendDm(yoda.token, dm.dmId, 'Hello everyone, we must humiliate anakin')
    const message = temp.data as messageIdType;
    requestMessageSendDm(yoda.token, dm.dmId, 'I believe the best way to do this is to give him a seat')
    requestMessageSendDm(yoda.token, dm.dmId, 'But not give him the rank of Master MWAHAHAHHAHAHA');
    const result = requestMessageEdit(anakin.token, message.messageId, "nooooooooo please don't");
    expect(result.statusCode).toEqual(400);
  });

  test('The message was not sent by the user and they are not the owner (channel)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'asdgfhjahsdf', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'fjaksgdfhkjadf', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Secret meeting', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId)
    const buffer = requestMessageSend(palpatine.token, channel.channelId, 'Hello there');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    const result = requestMessageEdit(anakin.token, message.messageId, 'Goodbye');
    expect(result.statusCode).toEqual(403);
  });

  test('The message was not sent by the user and they are not the owner (dm)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'asdgfhjahsdf', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'fjaksgdfhkjadf', 'sheev', 'palpatine');
    const bufferOne = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = bufferOne.data as dmIdType;
    const bufferTwo = requestMessageSendDm(palpatine.token, dm.dmId, 'Hello there');
    const message = bufferTwo.data as messageIdType;
    const result = requestMessageEdit(anakin.token, message.messageId, 'Goodbye');
    expect(result.statusCode).toEqual(403);
  });
  
  test('editing channel with only one message', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Broskis', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    const buffer = requestMessageSend(palpatine.token, channel.channelId, 'pish posh');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    const result = requestMessageEdit(palpatine.token, message.messageId, 'edited message');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  test('editing dm with only one message', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = buffer.data as dmIdType;
    const temp = requestMessageSendDm(palpatine.token, dm.dmId, 'pish posh');
    const message = temp.data as messageIdType;
    const result = requestMessageEdit(palpatine.token, message.messageId, 'edited message');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  test('editing channel with multiple messages', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Broskis', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 1');
    const buffer = requestMessageSend(palpatine.token, channel.channelId, 'pish posh');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 2');
    const result = requestMessageEdit(palpatine.token, message.messageId, 'edited message');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  test('editing dm with multiple messages', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = buffer.data as dmIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'fake message no. 1');
    const temp = requestMessageSendDm(palpatine.token, dm.dmId, 'pish posh');
    const message = temp.data as messageIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'fake message no. 2');
    const result = requestMessageEdit(palpatine.token, message.messageId, 'edited message');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  test('removing message from channel with one message', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Broskis', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    const buffer = requestMessageSend(palpatine.token, channel.channelId, 'pish posh');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    const result = requestMessageEdit(palpatine.token, message.messageId, '');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  test('removing message from dm with one message', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = buffer.data as dmIdType;
    const temp = requestMessageSendDm(palpatine.token, dm.dmId, 'pish posh');
    const message = temp.data as messageIdType;
    const result = requestMessageEdit(palpatine.token, message.messageId, '');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  test('removing message from channel with multiple messages', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Broskis', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 1');
    const buffer = requestMessageSend(palpatine.token, channel.channelId, 'pish posh');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 2');
    const result = requestMessageEdit(palpatine.token, message.messageId, '');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });
  
  test('removing message from dm with multiple messages', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'xmncvbx', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qetwyuire', 'sheev', 'palpatine');
    const buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = buffer.data as dmIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'fake message no. 1');
    const temp = requestMessageSendDm(palpatine.token, dm.dmId, 'pish posh');
    const message = temp.data as messageIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'fake message no. 2');
    const result = requestMessageEdit(palpatine.token, message.messageId, '');
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({});
  });

  // Redudant tests:
  // test('User does not have owner permissions in channel and they did not send the message', () => {
  //   const anakin = requestAuthRegister('anakin@gmail.com', 'xcbtii', 'anakin', 'skywalker');
  //   const palpatine = requestAuthRegister('palpatine@gmail.com', 'xnbcvm', 'sheev', 'palpatine');
  //   const channel = requestChannelsCreate(palpatine.token, 'Casual Sith Meeting', false);
  //   requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
  //   const buffer = requestMessageSend(palpatine.token, channel.channelId, 'Hello there my dear apprentice');
  //   const message = JSON.parse(buffer.getBody() as string) as messageIdType;
  //   const result = requestMessageEdit(anakin.token, message.messageId, "Don't talk to me");
  //   expect(result.statusCode).toEqual(403);
  // });

  // test('error case, user does not have owner permissions in dm', () => {
  //   const anakin = requestAuthRegister('anakin@gmail.com', 'xcbtii', 'anakin', 'skywalker');
  //   const palpatine = requestAuthRegister('palpatine@gmail.com', 'xnbcvm', 'sheev', 'palpatine');
  //   let buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
  //   const dm = buffer.data as dmIdType;
  //   buffer = requestMessageSendDm(palpatine.token, dm.dmId, 'Hello there');
  //   const message = buffer.data as messageIdType;
  //   const result = requestMessageEdit(anakin.token, message.messageId, 'Goodbye');
  //   expect(result.data).toStrictEqual({ error: 'error' });
  //   expect(result.statusCode).toEqual(400); 
  // });
});

describe('message/remove/v2', () => {
  beforeEach(() => {
    requestClear();
  });

  test('MessageId does not refer to a valid message in a channel', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const channel = requestChannelsCreate(anakin.token, 'Sith > Jedi', false);
    requestMessageSend(anakin.token, channel.channelId, 'Fake mesage no. 1');
    requestMessageSend(anakin.token, channel.channelId, 'Fake mesage no. 2');
    requestMessageSend(anakin.token, channel.channelId, 'Fake mesage no. 3');
    const result = requestMessageRemove(anakin.token, -48792);
    expect(result.statusCode).toEqual(400);
  });
  
  test('MessageId does not refer to a valid message in a channel that the user is a member', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const fakeChannel = requestChannelsCreate(palpatine.token, 'Sith eyes only', false);
    requestMessageSend(palpatine.token, fakeChannel.channelId, 'Hello everyone');
    const buffer = requestMessageSend(palpatine.token, fakeChannel.channelId, 'Welcome to the annual Sith meeting');
    const message = JSON.parse(buffer.getBody() as string) as messageIdType;
    const channel = requestChannelsCreate(anakin.token, 'Sith > Jedi', false);
    requestMessageSend(anakin.token, channel.channelId, 'Fake mesage no. 1');
    requestMessageSend(anakin.token, channel.channelId, 'Fake mesage no. 2');
    requestMessageSend(anakin.token, channel.channelId, 'Fake mesage no. 3');
    const result = requestMessageRemove(anakin.token, message.messageId);
    expect(result.statusCode).toEqual(400);
  });

  test('MessageId does not refer to a valid message in a dm', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'sdfghjrxc', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qyiuw4l', 'sheev', 'palpatine');
    const buffer = requestDmCreate(palpatine.token, [anakin.authUserId]);
    const dm = buffer.data as dmIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'Fake message no. 1');
    requestMessageSendDm(palpatine.token, dm.dmId, 'Fake message no. 2');
    requestMessageSendDm(palpatine.token, dm.dmId, 'Fake message no. 3');
    const result = requestMessageRemove(palpatine.token, -53674);
    expect(result.statusCode).toEqual(400);
  });

  test('The message was not sent by the user and the user is not an owner (channel)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Sith Meeting', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    requestMessageSend(palpatine.token, channel.channelId, 'Fake message no. 1');
    requestMessageSend(palpatine.token, channel.channelId, 'Hello, you are evil');
    const message = JSON.parse(
      requestMessageSend(palpatine.token, channel.channelId, 'Um no I am not'
    ).getBody() as string) as messageIdType;
    requestMessageSend(palpatine.token, channel.channelId, 'Fake message no. 2');
    const result = requestMessageRemove(anakin.token, message.messageId);
    expect(result.statusCode).toEqual(403);
  });

  test('The message was not sent by the user and the user is not an owner (dm)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const dm = requestDmCreate(palpatine.token, [anakin.authUserId]).data as dmIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'Fake message no. 1');
    requestMessageSendDm(palpatine.token, dm.dmId, 'Hello, you are evil');
    const message = requestMessageSendDm(palpatine.token, dm.dmId, 'Um no I am not').data as messageIdType;
    requestMessageSendDm(palpatine.token, dm.dmId, 'Fake message no. 2');
    const result = requestMessageRemove(anakin.token, message.messageId);
    expect(result.statusCode).toEqual(403);
  });

  test('The user is an owner deleting another member\'s message (channel)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Sith Meeting', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    const message = JSON.parse(
      requestMessageSend(anakin.token, channel.channelId, 'Fake message no. 2'
    ).getBody() as string) as messageIdType;
    const result = requestMessageRemove(palpatine.token, message.messageId);
    expect(result.statusCode).toEqual(200);
  });

  test('The user is the owner deleting another member\'s message (dm)', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const dm = requestDmCreate(palpatine.token, [anakin.authUserId]).data as dmIdType;
    const message = requestMessageSendDm(anakin.token, dm.dmId, 'I think I have kids!').data as messageIdType;
    const result = requestMessageRemove(palpatine.token, message.messageId);
    expect(result.statusCode).toEqual(200);
  });

  test('removing a message from a channel with one message', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Sith Lord Meetings', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    const message = JSON.parse(
      requestMessageSend(palpatine.token, channel.channelId, 'Hello there'
      ).getBody() as string) as messageIdType;
    const result = requestMessageRemove(palpatine.token, message.messageId);
    expect(result.statusCode).toEqual(200);
  });

  test('removing a message from a channel with multiple messages', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const channel = requestChannelsCreate(palpatine.token, 'Sith Lord Meetings', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 1');
    const message = JSON.parse(
      requestMessageSend(palpatine.token, channel.channelId, 'Hello there'
    ).getBody() as string) as messageIdType;
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 2');
    requestMessageSend(palpatine.token, channel.channelId, 'fake message no. 3');
    const result = requestMessageRemove(palpatine.token, message.messageId);
    expect(result.statusCode).toEqual(200);
  });

  test('removing a message from a dm with one message', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const dm = requestDmCreate(palpatine.token, [anakin.authUserId]).data as dmIdType;
    const message = requestMessageSendDm(palpatine.token, dm.dmId, 'Dm to be removed').data as messageIdType;
    const result = requestMessageRemove(palpatine.token, message.messageId);
    expect(result.statusCode).toEqual(200);
  });
  
  test('removing a message from a dm with multiple messages', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'askl;dfgjdfg', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qeiouy', 'sheev', 'palpatine');
    const dm = requestDmCreate(palpatine.token, [anakin.authUserId]).data as dmIdType;
    requestMessageSendDm(anakin.token, dm.dmId, 'Fake message no. 1');
    const message = requestMessageSendDm(anakin.token, dm.dmId, 'Dm to be removed').data as messageIdType;
    requestMessageSendDm(anakin.token, dm.dmId, 'Fake message no. 2');
    requestMessageSendDm(anakin.token, dm.dmId, 'Fake message no. 3');
    const result = requestMessageRemove(anakin.token, message.messageId);
    expect(result.statusCode).toEqual(200);
  });
});