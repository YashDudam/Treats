// dm.test.ts
// Jest testing for dm features

import request from 'sync-request'
import config from '../config.json'
import { authUserIdType, dmIdType, messageIdType, message } from '../types';
import { getUNIXTime } from '../other';

const SERVER_URL: string = config.url + ':' + config.port;

describe('dm/create/v2', () => {

  let globalUser: authUserIdType;
  let user: authUserIdType;
  let anotherUser: authUserIdType;

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
  });

  test('Invalid token', () => {
    let res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
          body: JSON.stringify({
            uIds: [
              anotherUser.authUserId
            ]
          }),
          headers: {
            'content-type': 'application/json',
            'token': 'AB84'
          }
      }
    );
    expect(res.statusCode).toEqual(403)
  });

  test('Invalid uId(s)', () => {
    // One invalid uId
    let res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            -23492304,
            anotherUser.authUserId
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400)

    // Multiple invalid uIds
    res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            -23423043,
            -69056095
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400)
  });

  test('Duplicate uId(s)', () => {
    let res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
          body: JSON.stringify({
            uIds: [
              anotherUser.authUserId,
              anotherUser.authUserId
            ]
          }),
          headers: {
            'content-type': 'application/json',
            'token': user.token
          }
      }
    );
    expect(res.statusCode).toEqual(400)
  });

  test('Success', () => {
    let res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [user.authUserId]
        }),
        headers: {
          'content-type': 'application/json',
          'token': anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const newDm = JSON.parse(res.getBody() as string);
    expect(newDm).toStrictEqual({ dmId: expect.any(Number) });

    // Make sure dm is added to dataStore
    res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: newDm.dmId
        },
        headers: {
          'token': user.token
        }
      }
    );

    expect(JSON.parse(res.getBody() as string)).toEqual({
      name: 'darthsidious, darthvader',
      members: [
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
});

describe('dm/list/v2', () => {

  let globalUser: authUserIdType;
  let user: authUserIdType;
  let anotherUser: authUserIdType;

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
  });

  test('Invalid token', () => {
    let res = request(
      'GET',
      SERVER_URL + '/dm/list/v2',
      {
        headers: {
          'token': 'AB8A'
        }
      }
    );
    expect(res.statusCode).toEqual(403)
  });

  test('No dms', () => {
    let res = request(
      'GET',
      SERVER_URL + '/dm/list/v2',
      {
        headers: {
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({dms:[]});
  });

  test('Display dms', () => {
    //Add dms
    let res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            user.authUserId
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': anotherUser.token
        }
      }
    );
    const newDm = JSON.parse(res.getBody() as string);
    expect(newDm).toStrictEqual({ dmId: expect.any(Number) });

    res = request(
      'POST',
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            user.authUserId,
            anotherUser.authUserId
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    const newDm2 = JSON.parse(res.getBody() as string);
    expect(newDm2).toStrictEqual({ dmId: expect.any(Number) });

    res = request(
      'GET',
      SERVER_URL + '/dm/list/v2',
      {
        headers: {
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({dms:[
      {
        dmId: newDm.dmId,
        name: 'darthsidious, darthvader'
      },
      {
        dmId: newDm2.dmId,
        name: 'darthsidious, darthvader, theforce'
      }
    ]});
  });
});

describe('dm/details/v2', () => {
  let user: authUserIdType,
    anotherUser: authUserIdType,
    globalUser: authUserIdType,
    dm: dmIdType;

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
          nameLast: 'Force',
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
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            anotherUser.authUserId
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    dm = JSON.parse(res.getBody() as string);
  });

  test('Invalid token', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: dm.dmId
        },
        headers: {
          'token': '-32423084'
        }
      }
    );
    expect(res.statusCode).toEqual(403)
  });

  test('Invalid dmId', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: -2984208
        },
        headers: {
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(400)
  });

  test('User is not in dm', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: dm.dmId
        },
        headers: {
          token: user.token
        }
      }
    );
    expect(res.statusCode).toEqual(403)
  });

  test('Success', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: dm.dmId
        },
        headers: {
          token: anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toEqual({
      name: 'darthsidious, theforce',
      members: [
        {
            uId: globalUser.authUserId,
            email: 'itsallaroundus@outlook.com',
            nameFirst: 'The',
            nameLast: 'Force',
            handleStr: 'theforce'
        },
        {
          uId: anotherUser.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ]
    });
  });
});

describe('dm/leave/v2', () => {
  
  let user: authUserIdType,
    anotherUser: authUserIdType,
    globalUser: authUserIdType,
    dm: dmIdType;

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
          nameLast: 'Force',
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
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            anotherUser.authUserId
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    dm = JSON.parse(res.getBody() as string);
  });

  test('Invalid token', () => {
    const res = request(
      'POST',
      SERVER_URL + '/dm/leave/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
        }),
        headers: {
          'content-type': 'application/json',
          'token': '-3141592'
        }
      }
    );
    expect(res.statusCode).toEqual(403)
  }); 

  test('Invalid dmId', () => {
    const res = request(
      'POST',
      SERVER_URL + '/dm/leave/v2',
      {
        body: JSON.stringify({
          dmId: -3141592,
        }),
        headers: {
          'content-type': 'application/json',
          'token': anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(400)
  });

  test('User is not a dm member',  () => {
    const res = request(
      'POST',
      SERVER_URL + '/dm/leave/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId
        }),
        headers: {
          'content-type': 'application/json',
          'token': user.token
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Dm member leaving', () => {
    let res = request(
      'POST',
      SERVER_URL + '/dm/leave/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId
        }),
        headers: {
          'content-type': 'application/json',
          'token': anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    // Check using dm details 
    res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: dm.dmId
        },
        headers: {
          'token': globalUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: 'darthsidious, theforce',
      members: [
        {
          uId: globalUser.authUserId,
          email: 'itsallaroundus@outlook.com',
          nameFirst: 'The',
          nameLast: 'Force',
          handleStr: 'theforce'
        }
      ]
    });
  });

  test('Dm owner leaving', () => {
    let res = request(
      'POST',
      SERVER_URL + '/dm/leave/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    // Check using dm details 
    res = request(
      'GET',
      SERVER_URL + '/dm/details/v2',
      {
        qs: {
          dmId: dm.dmId
        },
        headers: {
          'token': anotherUser.token
        } 
      }
    );
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.getBody() as string)).toStrictEqual({
      name: 'darthsidious, theforce',
      members: [
        {
          uId: anotherUser.authUserId,
          email: 'justasenator@gmail.com',
          nameFirst: 'Darth',
          nameLast: 'Sidious',
          handleStr: 'darthsidious'
        }
      ]
    });
  });
});

describe('dm/messages/v2', () => {

  let user: authUserIdType,
    anotherUser: authUserIdType,
    globalUser: authUserIdType,
    dm: dmIdType,
    message1: messageIdType,
    message2: messageIdType;

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
          nameLast: 'Force',
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
      SERVER_URL + '/dm/create/v2',
      {
        body: JSON.stringify({
          uIds: [
            anotherUser.authUserId
          ]
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    dm = JSON.parse(res.getBody() as string);

    // Send a few messages
    res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: 'Hey tell Vader about his son'
        }),
        headers: {
          'content-type': 'application/json',
          'token': globalUser.token
        }
      }
    );
    message1 = JSON.parse(res.getBody() as string);

    res = request(
      'POST',
      SERVER_URL + '/message/senddm/v2',
      {
        body: JSON.stringify({
          dmId: dm.dmId,
          message: 'Aight fine!'
        }),
        headers: {
          'content-type': 'application/json',
          'token': anotherUser.token
        }
      }
    );
    message2 = JSON.parse(res.getBody() as string);
  });

  test('Invalid token', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/messages/v2',
      {
        qs: {
          dmId: dm.dmId,
          start: 0
        },
        headers: {
          'token': '-32423084'
        }
      }
    );
    expect(res.statusCode).toEqual(403)
  });

  test('Invalid dmId', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/messages/v2',
      {
        qs: {
          dmId: -2984208,
          start: 0
        },
        headers: {
          'token': anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(400)
  });

  test('Start > messages in channel', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/messages/v2',
      {
        qs: {
          dmId: dm.dmId,
          start: 3
        },
        headers: {
          'token': anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(400)
  });

  test('User is not in dm', () => {
    const res = request(
      'GET',
      SERVER_URL + '/dm/messages/v2',
      {
        qs: {
          dmId: dm.dmId,
          start: 0
        },
        headers: {
          'token': user.token,
        }
      }
    );
    expect(res.statusCode).toEqual(403)
  });

  test('Success (< 50 messages)', () => {
    const expectedTime = getUNIXTime();
    const res = request(
      'GET',
      SERVER_URL + '/dm/messages/v2',
      {
        qs: {
          dmId: dm.dmId,
          start: 0
        },
        headers: {
          'token': anotherUser.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const messages = JSON.parse(res.getBody() as string);
    expect(messages).toStrictEqual({
      messages: [
        {
          messageId: message2.messageId,
          uId: anotherUser.authUserId,
          message: 'Aight fine!',
          timeSent: expect.any(Number)
        },
        {
          messageId: message1.messageId,
          uId: globalUser.authUserId,
          message: 'Hey tell Vader about his son',
          timeSent: expect.any(Number)
        }
      ],
      start: 0,
      end: -1
    });
    // Check that timeSent is valid
    messages.messages.forEach((message: message) => {
      // expect(message.timeSent).toBeGreaterThanOrEqual(expectedTime);
      expect(message.timeSent).toBeLessThan(expectedTime + 1);
    });
  });
  
  test('Success (> 50 messages)', () => {
    // Add 50 messages to the dm (total 52)
    // Create array to store some expected output properties
    const messageOutput = [];
    // Add existing messages to this array
    messageOutput.unshift({
      messageId: message1.messageId,
      uId: globalUser.authUserId,
      message: 'Hey tell Vader about his son'
    });
    messageOutput.unshift({
      messageId: message2.messageId,
      uId: anotherUser.authUserId,
      message: 'Aight fine!'
    });

    // Initialise + add new messages
    for (let i = 0; i < 50; i++) {
      let res = request(
        'POST',
        SERVER_URL + '/message/senddm/v2',
        {
          body: JSON.stringify({
            dmId: dm.dmId,
            message: `<${i}>`
          }),
          headers: {
            'content-type': 'application/json',
            'token': globalUser.token
          }
        }
      );
      const messageId = JSON.parse(res.getBody() as string).messageId;
      messageOutput.unshift({
        messageId: messageId,
        uId: globalUser.authUserId,
        message:  `<${i}>`
      });
    }

    const offset = 1;

    const res = request(
      'GET',
      SERVER_URL + '/dm/messages/v2',
      {
        qs: {
          dmId: dm.dmId,
          start: offset
        },
        headers: {
          token: anotherUser.token,
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const messages = JSON.parse(res.getBody() as string);
    expect(messages.messages.length).toEqual(50);
    for (let i = 0; i < 50; i++) {
      expect(messages.messages[i]).toStrictEqual({
        messageId: messageOutput[i+offset].messageId,
        uId: messageOutput[i+offset].uId,
        message: messageOutput[i+offset].message,
        timeSent: expect.any(Number)
      })
      expect(messages.start).toEqual(offset);
      expect(messages.end).toEqual(offset + 50);
    }
  });
});

// Helper function to simplify code that calls 'POST' requests
const post = (path: string, body: any, token?: string) => {
  let headers: any;
  if (token !== undefined) {
    headers = {
      'content-type': 'application/json',
      'token': token
    }
  } else {
    headers = {
      'content-type': 'application/json'
    }
  }
  const res = request(
    'POST',
    `${config.url}:${config.port}/${path}`,
    {
      body: JSON.stringify(body),
      headers: headers
    }
  );

  if (res.statusCode !== 200) return { statusCode: res.statusCode };

  return {
    body: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode
  }
};

// Helper function to simplify code that calls 'DELETE' requests
const deleteRequest = (path: string, qs: any, token: string) => {
  const res = request(
    'DELETE',
    `${config.url}:${config.port}/${path}`,
    {
      qs: qs,
      headers: {
        'token': token
      }
    }
  );
  if (res.statusCode !== 200) return { statusCode: res.statusCode };
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.getBody() as string)
  };
};

describe('dm/remove/v2', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
  });

  test('Invalid token', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const dm = post('dm/create/v2',
      {
        uIds: [register2.authUserId],
      },
      register1.token,
    ).body;
    const result = deleteRequest('dm/remove/v2',
      {
        dmId: dm.dmId,
      },
      '-1922734'
    );
    expect(result.statusCode).toEqual(403);
  });

  test('Success case', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const dm = post('dm/create/v2',
      {
        uIds: [register2.authUserId],
      },
      register1.token,
    ).body;
    const result = deleteRequest('dm/remove/v2',
      {
        dmId: dm.dmId,
      },
      register1.token
    );
    expect(result.statusCode).toEqual(200);
    expect(result.body).toStrictEqual({});
  });

  test('Error: dmId does not refer to a valid DM', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const dm = post('dm/create/v2',
      {
        uIds: [register2.authUserId]
      },
      register1.token
    ).body;
    const result = deleteRequest('dm/remove/v2',
      {
        dmId: dm.dmId + 1,
      },
      register1.token
    );
    expect(result.statusCode).toEqual(400);
  });

  test('Error: valid dmId but the authUser is not the original DM creator', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const dm = post('dm/create/v2',
      {
        uIds: [register2.authUserId],
      },
      register1.token
    ).body;
    const result = deleteRequest('dm/remove/v2',
      {
        dmId: dm.dmId,
      },
      register2.token
    );
    expect(result.statusCode).toEqual(403)
  });

  test('Error: valid dmId but authUser is no longer in the DM', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      },
    ).body;
    const dm = post('dm/create/v2',
      {
        uIds: [register2.authUserId],
      },
      register1.token
    ).body;
    post('dm/leave/v2', 
      {
        dmId: dm.dmId,
      },
      register1.token
    );
    const result = deleteRequest('dm/remove/v2',
      {
        dmId: dm.dmId,
      },
      register1.token
    );
    expect(result.statusCode).toEqual(403);
  });
});
