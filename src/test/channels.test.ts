import { authRegisterV1 } from '../auth';
import { SERVER_URL, generateToken } from '../other';
import { authUserIdType, channelIdType } from '../types';
import request from 'sync-request';
import { requestAuthRegister } from '../requests';

describe('channels/create/v3', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
  });

  test('Invalid token', () => {
    request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
          email: 'woop@gmail.com',
          password: 'Password',
          nameFirst: 'Woop',
          nameLast: 'Smith'
        }),
        headers: {
          'content-type': 'application/json',
        }
      }
    );
    const res = request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Cool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          'token': '-3141592'
        },
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('Success', () => {
    const register = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
          email: 'woop@gmail.com',
          password: 'Password',
          nameFirst: 'Woop',
          nameLast: 'Smith'
        }),
        headers: {
          'content-type': 'application/json',
        }
      }
    );
    const validToken = JSON.parse(String(register.getBody())).token
    const res = request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Cool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          'token': validToken
        },
      }
    );
    expect(res.statusCode).toEqual(200);
    const Obj = JSON.parse(res.getBody() as string);
    expect(Obj).toStrictEqual({ channelId: expect.any(Number) });
  });
  
  test('Channel name too long', () => {
    const register = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
            email: 'woop@gmail.com',
            password: 'Password',
            nameFirst: 'Woop',
            nameLast: 'Smith'
        }),
        headers: {
            'content-type': 'application/json',
        }
      }
    );
    const validToken = JSON.parse(register.getBody() as string).token;
    const res = request(
        'POST',
        SERVER_URL + '/channels/create/v3',
        {
            body: JSON.stringify({
              name: 'THIS CHANNEL IS SO EPIC AND NOT TOO LONG AT ALL',
              isPublic: true
            }),
            headers: {
              'content-type': 'application/json',
              'token': validToken,
            },
        }
    );
    expect(res.statusCode).toEqual(400);
  });

  test('Channel name too short', () => {
    const register = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        body: JSON.stringify({
            email: 'woop@gmail.com',
            password: 'Password',
            nameFirst: 'Woop',
            nameLast: 'Smith'
        }),
        headers: {
            'content-type': 'application/json',
        }
      }
    );
    const validToken = JSON.parse(register.getBody() as string).token;
    const res = request(
        'POST',
        SERVER_URL + '/channels/create/v3',
        {
            body: JSON.stringify({
              name: '',
              isPublic: true
            }),
            headers: {
              'content-type': 'application/json',
              'token': validToken,
            },
        }
    );
    expect(res.statusCode).toEqual(400);
  });
});

describe('channels/list/v3', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
  });

  test('invalid token', () => {
    requestAuthRegister('woop@gmail.com', 'Password', 'Woopert', 'Smith') as authUserIdType;
    const res = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        headers: {
          'content-type': 'application/json',
          'token': '-2342'
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('successfully list one channel', () => {
    const authReg = requestAuthRegister('woop@gmail.com', 'Password', 'Woopert', 'Smith') as authUserIdType;
    request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Cool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          token: authReg.token
        },
      }
    );
    const res = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        headers: {
          'content-type': 'application/json',
          'token': authReg.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const Obj = JSON.parse(res.getBody() as string);
    expect(Obj).toStrictEqual({channels: [{ 
      channelId: expect.any(Number),
      name: expect.any(String)
    }]});
  });

  test('successfully list two channels', () => {
    const authReg = requestAuthRegister('woop@gmail.com', 'Password', 'Woopert', 'Smith') as authUserIdType;
    request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Cool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          'token': authReg.token
        }
      }
    );
    request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Uncool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          token: authReg.token,
        }
      }
    );
    const res = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        headers: {
          'content-type': 'application/json',
          'token': authReg.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const Obj = JSON.parse(res.getBody() as string);
    expect(Obj).toStrictEqual({channels: [{ 
      channelId: expect.any(Number),
      name: expect.any(String)
    },
    {
      channelId: expect.any(Number),
      name: expect.any(String)
    }]});
  });
});

describe('channels/listall/v3', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
  });

  test('invalid token', () => {
    authRegisterV1('woop@gmail.com', 'Password', 'Woopert', 'Smith') as authUserIdType;
    const res = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        headers: {
          'content-type': 'application/json',
          'token': '-31415'
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('successfully list one channel by one person', () => {
    const register = authRegisterV1('woop@gmail.com', 'Password', 'Woopert', 'Smith') as authUserIdType;
    const validToken = register.token;
    
    request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Cool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          'token': validToken
        },
      }
    );
    const res = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        headers: {
          'content-type': 'application/json',
          'token': validToken
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const Obj = JSON.parse(res.getBody() as string);
    expect(Obj).toStrictEqual({channels: [{ 
      channelId: expect.any(Number),
      name: expect.any(String)
    }]});
  });
  
  test('successfully list two channels by two people', () => {
    const register1 = requestAuthRegister('woop@gmail.com', 'Password', 'Woopert', 'Smith') as authUserIdType;
    const validToken1 = register1.token;
    const register2 = requestAuthRegister('garyM8te@gmail.com', 'Glory4Gaz', 'Gaz', 'Shotgun') as authUserIdType;
    const validToken2 = register2.token;
    
    request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Cool Channel',
          isPublic: true
        }),
        headers: {
          'content-type': 'application/json',
          'token': validToken1
        },
      }
    );
    request(
      'POST',
      SERVER_URL + '/channels/create/v3',
      {
        body: JSON.stringify({
          name: 'Uncool Channel',
          isPublic: false
        }),
        headers: {
          'content-type': 'application/json',
          'token': validToken2
        },
      }
    );
    const res = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        headers: {
          'content-type': 'application/json',
          'token': validToken1
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const Obj = JSON.parse(res.getBody() as string);
    expect(Obj).toStrictEqual({channels: [{ 
        channelId: expect.any(Number),
        name: expect.any(String)
    },
    {
        channelId: expect.any(Number),
        name: expect.any(String)
    }]});
  });
});
