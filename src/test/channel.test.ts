import request from 'sync-request';
import config from '../config.json';
import { clearV1, getUNIXTime } from '../other';
import { requestAuthRegister, requestChannelInvite, requestChannelMessages, requestChannelsCreate, requestClear, requestMessageSend } from '../requests';
import { authUserIdType, channelIdType, messageIdType } from '../types';

const SERVER_URL = `${config.url}:${config.port}`;

// Helper function to simplify code that calls 'POST' requests
const post = (path: string, body: any, token?: string) => {
  let header = (token !== undefined) ? {
    'content-type': 'application/json',
    'token': token
  } : {
    'content-type': 'application/json'
  };
  const res = request(
    'POST',
    `${config.url}:${config.port}/${path}`,
    {
      body: JSON.stringify(body),
      headers: header
    }
  );
  if (res.statusCode !== 200) return { code: res.statusCode };
  const bodyObj = JSON.parse(String(res.getBody()));
  return {body: bodyObj, code: res.statusCode};
};

// Helper function to simplify code that calls 'DELETE' requests
const get = (path: string, qs: any, token?: string) => {
  let header = (token !== undefined) ? {
    'content-type': 'application/json',
    'token': token
  } : {
    'content-type': 'application/json'
  };
  const res = request(
    'GET',
    `${config.url}:${config.port}/${path}`,
    {
      qs: qs,
    }
  );
  if (res.statusCode !== 200) return { code: res.statusCode };
  const bodyObj = JSON.parse(String(res.getBody()));
  return {body: bodyObj, code: res.statusCode};
};

//////////////////////////////////////////////////////////////////////

describe('Testing channel/join/v3', () => {
  let user: authUserIdType,
    globalUser: authUserIdType,
    anotherUser: authUserIdType,
    publicChannel: channelIdType,
    privateChannel: channelIdType;

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

    // Create channels
    res = request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: '* D3ath 5t@rs *',
          isPublic: true,
        }),
        headers: {
          'content-type': 'application/json',
          'token':  anotherUser.token
        }
      }
    );
    publicChannel = JSON.parse(res.getBody() as string);

    res = request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Sheevie Jeebies',
          isPublic: false,
        }),
        headers: {
          'content-type': 'application/json',
          'token':  user.token,
        }
      }
    );
    privateChannel = JSON.parse(res.getBody() as string);
  });

  test('Invalid token', () => {
    const res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: publicChannel.channelId
        }),
        headers: {
          'content-type': 'application/json',
          'token':  '-128391'
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Invalid channel', () => {
    const res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: -1239320
        }),
        headers: {
          'content-type': 'application/json',
          'token':  user.token,
        }
      }
    );
    expect(res.statusCode).toEqual(400);
  });

  test('Success', () => {
    // Join the channel
    let res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: publicChannel.channelId
        }),
        headers: {
          'content-type': 'application/json',
          'token':  user.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({});

    // Check that the user is in the channel
    res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: publicChannel.channelId
        },
        headers: {
          'token':  anotherUser.token
        }
      }
    );
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: '* D3ath 5t@rs *',
      isPublic: true,
      ownerMembers: [
        {
          uId: anotherUser.authUserId,
          email: 'chosenone@hotmail.com',
          nameFirst: 'Darth',
          nameLast: 'Vader',
          handleStr: 'darthvader'
        }
      ],
      allMembers: [
        {
          uId: anotherUser.authUserId,
          email: 'chosenone@hotmail.com',
          nameFirst: 'Darth',
          nameLast: 'Vader',
          handleStr: 'darthvader'
        },
        {
          uId: user.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ]
    });
  });

  test('Already a channel member', () => {
    // Join the channel
    let res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: publicChannel.channelId
        }),
        headers: {
          'content-type': 'application/json',
          'token':  user.token
        }
      }
    );
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({});

    // Join the channel again
    res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: publicChannel.channelId
        }),
        headers: {
          'content-type': 'application/json',
          'token':  user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);

    // Check that the user is still in the channel
    res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: publicChannel.channelId
        },
        headers: {
          'token':  anotherUser.token
        }
      }
    );
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: '* D3ath 5t@rs *',
      isPublic: true,
      ownerMembers: [
        {
          uId: anotherUser.authUserId,
          email: 'chosenone@hotmail.com',
          nameFirst: 'Darth',
          nameLast: 'Vader',
          handleStr: 'darthvader'
        }
      ],
      allMembers: [
        {
          uId: anotherUser.authUserId,
          email: 'chosenone@hotmail.com',
          nameFirst: 'Darth',
          nameLast: 'Vader',
          handleStr: 'darthvader'
        },
        {
          uId: user.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ]
    });
  });

  test('Join private channel', () => {
    // Try joining
    let res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: privateChannel.channelId
        }),
        headers: {
          'content-type': 'application/json',
          'token':  anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(403);

    // Check that the user hasn't been added anyway
    res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: privateChannel.channelId
        },
        headers: {
          'token': user.token
        }
      }
    );
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: 'Sheevie Jeebies',
      isPublic: false,
      ownerMembers: [
        {
          uId: user.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ],
      allMembers: [
        {
          uId: user.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ]
    });
  });

  test('Join private channel as a treats owner', () => {
    // Try joining
    let res = request(
      'POST',
      SERVER_URL + '/channel/join/v3',
      {
        body: JSON.stringify({
          channelId: privateChannel.channelId
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({});

    // Check that the user is now a channel member
    res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: privateChannel.channelId
        },
        headers: {
          'token': user.token
        }
      }
    );
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: 'Sheevie Jeebies',
      isPublic: false,
      ownerMembers: [
        {
          uId: user.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ],
      allMembers: [
        {
          uId: user.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        },
        {
          uId: globalUser.authUserId,
          email: 'itsallaroundus@outlook.com',
          nameFirst: 'The',
          nameLast: 'Force',
          handleStr: 'theforce'
        },
      ]
    });
  });
});

describe('Testing channel/details/v3', () => {
  let user: authUserIdType,
    anotherUser: authUserIdType,
    channel: channelIdType;

  beforeEach(() => {
    // Clear data
    request('DELETE', SERVER_URL + '/clear/v1');

    // Add new users
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
          email: 'abc123@gmail.com',
          password: 'password',
          nameFirst: 'Harry',
          nameLast: 'Potter'
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
    anotherUser = JSON.parse(res.getBody() as string);

    // Create channels
    res = request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Wizards',
          isPublic: false,
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    channel = JSON.parse(res.getBody() as string);
  });

  test('Invalid token', () => {
    const res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: channel.channelId
        },
        headers: {
          'token': '-32423084'
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Invalid channelId', () => {
    const res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: -2984208
        },
        headers: {
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);
  });

  test('User is not in channel', () => {
    const res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: channel.channelId
        },
        headers: {
          'token': anotherUser.token,
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Valid inputs', () => {
    const res = request(
      'GET',
      SERVER_URL + '/channel/details/v3',
      {
        qs: {
          channelId: channel.channelId
        },
        headers: {
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: 'Wizards',
      isPublic: false,
      ownerMembers: [
        {
          uId: user.authUserId,
          email: 'abc123@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter'
        }
      ],
      allMembers: [
        {
          uId: user.authUserId,
          email: 'abc123@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter'
        }
      ]
    });
  });
});

beforeEach(() => {
  clearV1();
});

describe('channel/invite/v3', () => {
  test('Success case', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token
    );
    const result = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token
    );
    expect(result.code).toEqual(200);
    expect(result.body).toStrictEqual({});
  });

  test('Invalid token', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token
    );
    const result = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      '-182736'
    );
    expect(result.code).toEqual(403);
  });

  test('ChannelId does not refer to a valid channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token
    );
    const result = post('channel/invite/v3',
      {
        channelId: 0,
        uId: register2.body.authUserId,
      },
      register1.body.token
    );
    expect(result.code).toEqual(400);
  });

  test('UId does not refer to a valid user', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token
    );
    const result = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserID + 1,
      },
      register1.body.token
    );
    expect(result.code).toEqual(400);
  });

  test('User of ID "uId" is already a member of the channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register3 = post('auth/register/v3',
      {
        email: 'user3@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token
    );
    const invite1 = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token
    );
    const invite2 = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register2.body.token,
    );
    expect(result.code).toEqual(400);
  });

  test('Valid channelId but authUser is not a member of the channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register3 = post('auth/register/v3',
      {
        email: 'user3@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    const result = post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register2.body.token,
    );
    expect(result.code).toEqual(403);
  });
});

describe('channel/messages/v3', () => {
  test('Invalid channelId', () => {
    requestClear();
    const userOne = requestAuthRegister('anakin.skywalker@gmail.com', 'SITH4L1FERRR', 'anakin', 'skywalker');
    const userTwo = requestAuthRegister('kenobi@gmail.com', 'TheHighGround4Life', 'Obi-wan', 'Kenobi');
    const channel = requestChannelsCreate(userOne.token, 'Sith meeting', false);
    requestChannelInvite(userOne.token, channel.channelId, userTwo.authUserId);
    requestMessageSend(userOne.token, channel.channelId, 'Hello there');
    requestMessageSend(userTwo.token, channel.channelId, 'Anakin? What are you doing here?');
    requestMessageSend(userOne.token, channel.channelId, 'uhhhh...nothing...');
    const result = requestChannelMessages(userOne.token, -546, 0);
    expect(result.statusCode).toEqual(400);
    requestClear();
  });

  test('error case 2 (invalid start)', () => {
    requestClear();
    const userOne = requestAuthRegister('anakin.skywalker@gmail.com', 'SITH4L1FERRR', 'anakin', 'skywalker');
    const userTwo = requestAuthRegister('kenobi@gmail.com', 'TheHighGround4Life', 'Obi-wan', 'Kenobi');
    const channel = requestChannelsCreate(userOne.token, 'Sith meeting', false);
    requestChannelInvite(userOne.token, channel.channelId, userTwo.authUserId);
    requestMessageSend(userOne.token, channel.channelId, 'Hello there');
    requestMessageSend(userTwo.token, channel.channelId, 'Anakin? What are you doing here?');
    requestMessageSend(userOne.token, channel.channelId, 'uhhhh...nothing...');
    const result = requestChannelMessages(userOne.token, channel.channelId, 3);
    expect(result.statusCode).toEqual(400);
    requestClear();
  });
  
  test('error case 3 (invalid start)', () => {
    requestClear();
    const userOne = requestAuthRegister('anakin.skywalker@gmail.com', 'SITH4L1FERRR', 'anakin', 'skywalker');
    const userTwo = requestAuthRegister('kenobi@gmail.com', 'TheHighGround4Life', 'Obi-wan', 'Kenobi');
    const channel = requestChannelsCreate(userOne.token, 'Sith meeting', false);
    requestChannelInvite(userOne.token, channel.channelId, userTwo.authUserId);
    requestMessageSend(userOne.token, channel.channelId, 'Hello there');
    requestMessageSend(userTwo.token, channel.channelId, 'Anakin? What are you doing here?');
    requestMessageSend(userOne.token, channel.channelId, 'uhhhh...nothing...');
    const result = requestChannelMessages(userOne.token, channel.channelId, 54);
    expect(result.statusCode).toEqual(400);
    requestClear();
  });

  test('error case 4 (user is not a member of the channel)', () => {
    requestClear();
    const userOne = requestAuthRegister('anakin.skywalker@gmail.com', 'SITH4L1FERRR', 'anakin', 'skywalker');
    const userTwo = requestAuthRegister('palpatine@gmail.com', 'evilisgood', 'Sheev', 'Palpatine');
    const userThree = requestAuthRegister('kenobi@gmail.com', 'TheHighGround4Life', 'Obi-wan', 'Kenobi');
    const channel = requestChannelsCreate(userTwo.token, 'Sith meeting', false);
    requestChannelInvite(userTwo.token, channel.channelId, userOne.authUserId);
    requestMessageSend(userTwo.token, channel.channelId, 'Imagine being a little wuss and losing your legs');
    requestMessageSend(userOne.token, channel.channelId, ':(');
    requestMessageSend(userTwo.token, channel.channelId, "Yeah that's right, cry little baby");
    const result = requestChannelMessages(userThree.token, channel.channelId, 0);
    expect(result.statusCode).toEqual(403);
    requestClear();
  });

  test('success case, one message in channel', () => {
    requestClear();
    const user = requestAuthRegister('anakinskywalker@gmail.com', 'asdfasds', 'anakin', 'skywalker');
    const channel = requestChannelsCreate(user.token, 'The Jedi Council', false);
    requestChannelsCreate(user.token, 'secret council', false);
    requestChannelsCreate(user.token, 'fake council', true);
    requestMessageSend(user.token, channel.channelId, 'Hello there');
    const result = requestChannelMessages(user.token, channel.channelId, 0);
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({
      messages: [
        {
        messageId: expect.any(Number),
        uId: user.authUserId,
        message: 'Hello there',
        timeSent: expect.any(Number),
        }
      ],
      start: 0,
      end: -1,
    });
    requestClear();
  });
  
  test('success case, multiple messages in channel', () => {
    requestClear();
    const user = requestAuthRegister('anakinskywalker@gmail.com', 'asdfasds', 'anakin', 'skywalker');
    const channel = requestChannelsCreate(user.token, 'The Jedi Council', false);
    requestChannelsCreate(user.token, 'secret council', false);
    requestChannelsCreate(user.token, 'fake council', true);
    requestMessageSend(user.token, channel.channelId, 'Hello there');
    requestMessageSend(user.token, channel.channelId, 'Hello?');
    requestMessageSend(user.token, channel.channelId, 'Anyone here?');
    const result = requestChannelMessages(user.token, channel.channelId, 0);
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({
      messages: [
        {
        messageId: expect.any(Number),
        uId: user.authUserId,
        message: 'Anyone here?',
        timeSent: expect.any(Number),
      },
      {
        messageId: expect.any(Number),
        uId: user.authUserId,
        message: 'Hello?',
        timeSent: expect.any(Number),
      },
      {
        messageId: expect.any(Number),
        uId: user.authUserId,
        message: 'Hello there',
        timeSent: expect.any(Number),
        },
      ],
      start: 0,
      end: -1,
    });
    requestClear();
  });

  test('success case, more than 50 messages in a channel', () => {
    requestClear();
    const anakin = requestAuthRegister('anakinskywalker@gmail.com', 'asdfasds', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'oadfas', 'obi-wan', 'kenobi');
    requestChannelsCreate(kenobi.token, 'fake channel no. 1', false);
    const channel = requestChannelsCreate(anakin.token, 'Bros', false);
    requestChannelsCreate(kenobi.token, 'fake channel no. 2', false);
    requestChannelInvite(anakin.token, channel.channelId, kenobi.authUserId);
    const allMessages = [];
    for (let i = 0; i < 64; i++) {
      const messageOne = requestMessageSend(kenobi.token, channel.channelId, 'Hello there');
      const messageOneId = JSON.parse(messageOne.getBody() as string) as messageIdType;
        allMessages.unshift({
        messageId: messageOneId.messageId,
        uId: kenobi.authUserId,
        message: 'Hello there',
        timeSent: expect.any(Number),
      });
      const messageTwo = requestMessageSend(anakin.token, channel.channelId, 'General Kenobi');
      const messageTwoId = JSON.parse(messageTwo.getBody() as string) as messageIdType;
        allMessages.unshift({
        messageId: messageTwoId.messageId,
        uId: anakin.authUserId,
        message: 'General Kenobi',
        timeSent: expect.any(Number),
      });
    }
    const expectedMessages = [];
    for (let j = 0; j < 50; j++) {
      expectedMessages.push(allMessages[j]);
    }
    const result = requestChannelMessages(anakin.token, channel.channelId, 0);
    expect(result.statusCode).toEqual(200);
    expect(result.data).toStrictEqual({
      messages: expectedMessages,
      start: 0,
      end: 50,
    });
    requestClear();
  });

  test('success case, a different start', () => {
    requestClear();
    const anakin = requestAuthRegister('anakinskywalker@gmail.com', 'asdfasds', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'oadfas', 'obi-wan', 'kenobi');
    requestChannelsCreate(kenobi.token, 'fake channel no. 1', false);
    const channel = requestChannelsCreate(anakin.token, 'Bros', false);
    requestChannelsCreate(kenobi.token, 'fake channel no. 2', false);
    requestChannelInvite(anakin.token, channel.channelId, kenobi.authUserId);
    const allMessages = [];
    for (let i = 0; i < 64; i++) {
      const message = requestMessageSend(anakin.token, channel.channelId, `Message number: ${i}`);
      const messageId = JSON.parse(message.getBody() as string) as messageIdType;
      allMessages.unshift({
        messageId: messageId.messageId,
        uId: anakin.authUserId,
        message: `Message number: ${i}`,
        timeSent: expect.any(Number),
      });
    }
    const expectedMessages = [];
    for (let j = 10; j < 60; j++) {
      expectedMessages.push(allMessages[j]);
    }
    const result = requestChannelMessages(anakin.token, channel.channelId, 10);
    expect(result.statusCode).toStrictEqual(200);
    expect(result.data).toStrictEqual({
      messages: expectedMessages,
      start: 10,
      end: 60,
    });
    requestClear();
  });
  
  test('success case, a different start but less than 50 messages', () => {
    requestClear();
    const anakin = requestAuthRegister('anakinskywalker@gmail.com', 'asdfasds', 'anakin', 'skywalker');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'oadfas', 'obi-wan', 'kenobi');
    requestChannelsCreate(kenobi.token, 'fake channel no. 1', false);
    const channel = requestChannelsCreate(anakin.token, 'Bros', false);
    requestChannelsCreate(kenobi.token, 'fake channel no. 2', false);
    requestChannelInvite(anakin.token, channel.channelId, kenobi.authUserId);
    const allMessages = [];
    for (let i = 0; i < 64; i++) {
      const message = requestMessageSend(anakin.token, channel.channelId, `Message number: ${i}`);
      const messageId = JSON.parse(message.getBody() as string) as messageIdType;
      allMessages.unshift({
        messageId: messageId.messageId,
        uId: anakin.authUserId,
        message: `Message number: ${i}`,
        timeSent: expect.any(Number),
      });
    }
    const expectedMessages = [];
    for (let j = 30; j < 64; j++) {
      expectedMessages.push(allMessages[j]);
    }
    const result = requestChannelMessages(anakin.token, channel.channelId, 30);
    expect(result.statusCode).toStrictEqual(200);
    expect(result.data).toStrictEqual({
      messages: expectedMessages,
      start: 30,
      end: -1,
    });
    requestClear();
  });
});

describe('channel/leave/v2', () => {
  test('Success case', () => {
    const register = post('auth/register/v3',
      {
        email: 'user@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      }
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel',
        isPublic: true,
      },
      register.body.token
    );
    const result = post('channel/leave/v2',
      {
        channelId: channel.body.channelId,
      },
      register.body.token
    );
    expect(result.code).toEqual(200);
    expect(result.body).toStrictEqual({});
  });

  test('Invalid token', () => {
    const register = post('auth/register/v3',
      {
        email: 'user@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      }
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel',
        isPublic: true,
      },
      register.body.token
    );
    const result = post('channel/leave/v2',
      {
        channelId: channel.body.channelId,
      },
      '-132891'
    );
    expect(result.code).toEqual(403);
  });

  test('Error: channelId does not refer to a valid channel', () => {
    const register = post('auth/register/v3',
      {
        email: 'user@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel',
        isPublic: true,
      },
      register.body.token,
    );
    const result = post('channel/leave/v2',
      {
        channelId: channel.body.channelId + 1,
      },
      register.body.token
    );
    expect(result.code).toEqual(400);
  });

  test('Error: valid channelId but authUser is not a member of channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    const result = post('channel/leave/v2',
      {
        channelId: channel.body.channelId,
      },
      register2.body.token
    );  
    expect(result.code).toEqual(403);
  });
});

describe('channel/addowner/v2', () => {
  test('Success case', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(200);
    expect(result.body).toStrictEqual({});
  });

  test('Invalid token', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      '-1231289'
    );
    expect(result.code).toEqual(403);
  });

  test('Error: channelId does not refer to a valid channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId + 1,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(400);
  });

  test('Error: uId does not refer to a valid user', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId + 1,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(400);
  });

  test('Error: user of ID "uID" is not a member of the channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(400);
  });

  test('Error: user of ID "uID" is already an owner of the channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register1.body.authUserId,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(400);
  });

  test('Error: valid channelId but authUser does not have owner permissions in channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register3 = post('auth/register/v3',
      {
        email: 'user3@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register2.body.token,
    );
    expect(result.code).toEqual(403);
  });
});

describe('channel/removeowner/v2', () => {
  test('Success case', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(200);
    expect(result.body).toStrictEqual({});
  });

  test('Invalid token', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      '-349304'
    );
    expect(result.code).toEqual(403);
  });

  test('Error: channelId does not refer to a valid channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId + 1,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );    
    expect(result.code).toEqual(400);
  });

  test('Error: uId does not refer to a valid user', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId + 1,
      },
      register1.body.token,
    );    
    expect(result.code).toEqual(400);
  });

  test('Error: user of ID "uId" is not an owner of the channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );    
    expect(result.code).toEqual(400);
  });

  test('Error: user of ID "uId" is currently the only owner of the channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register1.body.authUserId,
      },
      register1.body.token,
    );    
    expect(result.code).toEqual(400);
  });

  test('Error: valid channelId but authUser does not have owner permissions in channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register3 = post('auth/register/v3',
      {
        email: 'user3@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register3.body.token,
    );    
    expect(result.code).toEqual(403);
  });

  test('Error: valid channelId, authUser not channel owner, but is global owner ', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const register3 = post('auth/register/v3',
      {
        email: 'user3@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    );
    const channel = post('channels/create/v3',
      {
        name: 'Channel1',
        isPublic: true,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/invite/v3',
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2', 
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    post('channel/addowner/v2', 
      {
        channelId: channel.body.channelId,
        uId: register3.body.authUserId,
      },
      register1.body.token,
    );
    // Global owner must still be a member of the channel, so they cannot leave channel
    post('channel/removeowner/v2', 
      {
        channelId: channel.body.channelId,
        uId: register1.body.authUserId,
      },
      register2.body.token,
    );
    const result = post('channel/removeowner/v2',
      {
        channelId: channel.body.channelId,
        uId: register2.body.authUserId,
      },
      register1.body.token,
    );
    expect(result.code).toEqual(200);
    expect(result.body).toStrictEqual({});
  });
});

/* Old tests:
describe('Testing channelJoinV1()', () => {
  // Variables (reset between tests)
  let userId: authUserIdType;
  let anotherUserId: authUserIdType;
  let globalUserId: authUserIdType;
  let publicChannelId: channelIdType;
  let privateChannelId: channelIdType;

  beforeEach(() => {
    clearV1();

    // Create users
    globalUserId = authRegisterV1(
      'itsallaroundus@outlook.com',
      'midichlorians100',
      'The',
      'Force'
    ) as authUserIdType;
    userId = authRegisterV1(
      'justasenator@gmail.com',
      'palp@t1ne',
      'Darth',
      'Sidious'
    ) as authUserIdType;
    anotherUserId = authRegisterV1(
      'chosenone@hotmail.com',
      'darkside123',
      'Darth',
      'Vader'
    ) as authUserIdType;

    // Create channels
    publicChannelId = channelsCreateV1(
      anotherUserId.authUserId,
      '* D3ath 5t@rs *',
      true
    ) as channelIdType;
    privateChannelId = channelsCreateV1(
      userId.authUserId,
      'Sheevie Jeebies',
      false
    ) as channelIdType;
  });

  test('Invalid channelId', () => {
    expect(channelJoinV1(
      userId.authUserId,
      -2348920
    )).toStrictEqual({ error: 'error' });
  });

  test('Joining a new private channel as a treats member', () => {
    expect(channelJoinV1(anotherUserId.authUserId, privateChannelId.channelId))
      .toStrictEqual({ error: 'error' });
  });

  test('Joining a new private channel as a treats owner', () => {
    expect(channelJoinV1(globalUserId.authUserId, privateChannelId.channelId))
      .toStrictEqual({});
    expect(channelDetailsV1(
      globalUserId.authUserId,
      privateChannelId.channelId
    )).toStrictEqual({
      name: 'Sheevie Jeebies',
      isPublic: false,
      ownerMembers: [
        {
          uId: userId.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ],
      allMembers: [
        {
          uId: userId.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        },
        {
          uId: globalUserId.authUserId,
          email: 'itsallaroundus@outlook.com',
          nameFirst: 'The',
          nameLast: 'Force',
          handleStr: 'theforce'
        },
      ]
    });
  });

  test('Already a part of the channel', () => {
    expect(channelJoinV1(anotherUserId.authUserId, publicChannelId.channelId))
      .toStrictEqual({ error: 'error' });
  });

  test('A user joining a new public channel', () => {
    // Check return value
    expect(channelJoinV1(userId.authUserId, publicChannelId.channelId))
      .toStrictEqual({});
    // Check channel object
    expect(channelDetailsV1(
      userId.authUserId,
      publicChannelId.channelId
    )).toStrictEqual({
      name: '* D3ath 5t@rs *',
      isPublic: true,
      ownerMembers: [
        {
          uId: anotherUserId.authUserId,
          email: 'chosenone@hotmail.com',
          nameFirst: 'Darth',
          nameLast: 'Vader',
          handleStr: 'darthvader'
        }
      ],
      allMembers: [
        {
          uId: anotherUserId.authUserId,
          email: 'chosenone@hotmail.com',
          nameFirst: 'Darth',
          nameLast: 'Vader',
          handleStr: 'darthvader'
        },
        {
          uId: userId.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ]
    });
  });
});

describe('Testing channelDetailsV1()', () => {
  // Variables are defined globally - will still reset every test
  let userId: authUserIdType;
  let anotherUserId: authUserIdType;
  let channel: channelIdType;

  beforeEach(() => {
    clearV1();

    // Create users
    userId = authRegisterV1(
      'abc123@gmail.com',
      'password',
      'Harry',
      'Potter'
    ) as authUserIdType;

    anotherUserId = authRegisterV1(
      '123456@gmail.com',
      'abc123',
      'Darth',
      'Sidious'
    ) as authUserIdType;

    // Create channel
    channel = channelsCreateV1(
      userId.authUserId,
      'Wizards',
      false
    ) as channelIdType;

    // Put one user in channel
    channelJoinV1(userId.authUserId, channel.body.channelId);
  });

  test('Invalid channelId', () => {
    expect(channelDetailsV1(
      userId.authUserId,
      -2984208
    )).toStrictEqual({ error: 'error' });
  });

  test('User is not in channel', () => {
    expect(channelDetailsV1(
      anotherUserId.authUserId,
      channel.body.channelId
    )).toStrictEqual({ error: 'error' });
  });

  test('Valid inputs', () => {
    expect(channelDetailsV1(userId.authUserId, channel.body.channelId)).toStrictEqual({
      name: 'Wizards',
      isPublic: false,
      ownerMembers: [
        {
          uId: userId.authUserId,
          email: 'abc123@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter'
        }
      ],
      allMembers: [
        {
          uId: userId.authUserId,
          email: 'abc123@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter'
        }
      ]
    });
  });
});

describe('Testing channelMessagesV1', () => {
  test('invalid channelId', () => {
    clearV1();
    const user = authRegisterV1('John.doe@gmail.com', '5trongPassword', 'John', 'Doe') as authUserIdType;
    channelsCreateV1(user.authUserId, 'News', true);
    const result = channelMessagesV1(user.authUserId, NaN, 0);
    expect(result.body).toStrictEqual({
      error: 'error',
    });
  });

  test('start is greater than total messages in the channel', () => {
    clearV1();
    const user = authRegisterV1('John.doe@gmail.com', '5trongPassword', 'John', 'Doe') as authUserIdType;
    const channel = channelsCreateV1(user.authUserId, 'News', true) as channelIdType;
    const result = channelMessagesV1(user.authUserId, channel.body.channelId, 10);
    expect(result.body).toStrictEqual({
      error: 'error'
    });
  });

  test('authUserId is not a member of the channel', () => {
    clearV1();
    const user = authRegisterV1('John.doe@gmail.com', '5trongPassword', 'John', 'Doe') as authUserIdType;
    const channel = channelsCreateV1(user.authUserId, 'News', true) as channelIdType;
    const result = channelMessagesV1(user.authUserId, channel.body.channelId, 10);
    expect(result.body).toStrictEqual({
      error: 'error',
    });
  });

  test('valid inputs', () => {
    clearV1();
    const user = authRegisterV1('John.doe@gmail.com', '5trongPassword', 'John', 'Doe') as authUserIdType;
    const channel = channelsCreateV1(user.authUserId, 'News', true) as channelIdType;
    const result = channelMessagesV1(user.authUserId, channel.body.channelId, 0);
    expect(result.body).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('valid inputs with private channel', () => {
    clearV1();
    const user = authRegisterV1('John.doe@gmail.com', '5trongPassword', 'John', 'Doe') as authUserIdType;
    const channel = channelsCreateV1(user.authUserId, 'News', false) as channelIdType;
    const result = channelMessagesV1(user.authUserId, channel.body.channelId, 0);
    expect(result.body).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('user tries to access messages of a channel they are not a member of', () => {
    clearV1();
    const userOne = authRegisterV1('obiwan.kenobi@gmail.com', 'highground4life', 'Obiwan', 'Kenobi') as authUserIdType;
    const userTwo = authRegisterV1('darth.vader@gmail.com', 'ihatesand', 'Darth', 'Vader') as authUserIdType;
    const channelOne = channelsCreateV1(userOne.authUserId, 'How to get the high ground', true) as channelIdType;
    channelsCreateV1(userTwo.authUserId, 'Keeping Up with the Siths', false);
    expect(channelMessagesV1(userOne.authUserId, channelOne.channelId, 0)).toStrictEqual({
      error: 'error',
    });
  });

  test('start value is greater than number of messages', () => {
    clearV1();
    const user = authRegisterV1('anakinskywalker@gmail.com', 'ihatesand', 'Anakin', 'Skywalker') as authUserIdType;
    const channel = channelsCreateV1(user.authUserId, 'How to kill younglings', false) as channelIdType;
    expect(channelMessagesV1(user.authUserId, channel.body.channelId, 20)).toStrictEqual({
      error: 'error',
    });
  });
}); */
