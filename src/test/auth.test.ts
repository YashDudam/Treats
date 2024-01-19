import request from 'sync-request';
import config from '../config.json';
import { SERVER_URL, generateToken } from '../other';

beforeAll(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
});

const post = (path: string, body: any) => {
  const res = request(
    'POST',
    `${config.url}:${config.port}/${path}`,
    {
      body: JSON.stringify(body),
      headers: {
        'Content-type': 'application/json',
      },
    }
  );
  if (res.statusCode !== 200) return { res: res };
  const bodyObj = JSON.parse(res.getBody() as string);
  return { result: bodyObj, res: res };
};

//////////////////////////////////////////////////////

describe('auth/register/v3', () => {
  test('Success case', () => {
    const result = post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    expect(result.res.statusCode).toEqual(200);
    expect(result.result).toStrictEqual({ 
      token: expect.any(String), 
      authUserId: result.result.authUserId,
    });
  });

  test('Error: template ', () => {
    const result = post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    expect(result.res.statusCode).toEqual(400);
  });

  test('Error: email is not a valid email ', () => {
    const result = post('auth/register/v3',
    {
      email: 'email',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    expect(result.res.statusCode).toEqual(400);
  });

  test('Error: email being used by another user ', () => {
    post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    const result = post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    expect(result.res.statusCode).toEqual(400);
  });

  test('Error: password length too short: <6 ', () => {
    const result = post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: 'nope',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    expect(result.res.statusCode).toEqual(400);
  });

  test('Error: nameFirst length must be 1-50 characters incl. ', () => {
    const result = post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: '2004ArizonaIcedOutBoysYungLeandoershawtyEmotionalboys2001',
      nameLast: 'Lean',
    });
    expect(result.res.statusCode).toEqual(400);
  });

  test('Error: nameLast length must be 1-50 characters incl. ', () => {
    const result = post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: '',
    });
    expect(result.res.statusCode).toEqual(400);
  });
});

describe('auth/login/v3', () => {
  test('Success case', () => {
    post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    const result = post('auth/login/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
    });
    expect(result.res.statusCode).toEqual(200);
    expect(result.result).toStrictEqual({ 
      token: expect.any(String), 
      authUserId: result.result.authUserId,
    });
  });

  test('Error: email does not belong to a user', () => {
    post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    const result = post('auth/login/v3',
    {
      email: 'user2@email.com',
      password: 'Password5trong',
    });
    expect(result.res.statusCode).toEqual(400);
  });

  test('Error: incorrect password', () => {
    post('auth/register/v3',
    {
      email: 'user1@email.com',
      password: '5trongPassword',
      nameFirst: 'Yung',
      nameLast: 'Lean',
    });
    const result = post('auth/login/v3',
    {
      email: 'user1@email.com',
      password: 'StrongPassword',
    });
    expect(result.res.statusCode).toEqual(400);
  });
});

describe('auth/logout/v2', () => {
    test('Successful logout', () => {
      let res = request(
        'POST',
        SERVER_URL + '/auth/register/v3',
        {
          body: JSON.stringify({
              email: 'today@gmail.com',
              password: 'bigPassword',
              nameFirst: 'Derick',
              nameLast: 'Smudge'
          }),
          headers: {
              'content-type': 'application/json'
          },
        }
      );
      const regVal = JSON.parse(res.getBody() as string);

      res = request(
          'POST',
          SERVER_URL + '/auth/logout/v2',
          {
            body: JSON.stringify({}),
            headers: {
                'content-type': 'application/json',
                'token': regVal.token
            },
          }
      );
      expect(res.statusCode).toEqual(200);
      const Obj = JSON.parse(res.getBody() as string);
      expect(Obj).toStrictEqual({});
    });

    test('Invalid token', () => {
        request('DELETE', SERVER_URL + '/clear/v1');
        const register = request(
            'POST',
            SERVER_URL + '/auth/register/v3',
            {
                body: JSON.stringify({
                    email: 'woop@gmail.com',
                    password: 'Passsword',
                    nameFirst: 'Woop',
                    nameLast: 'Smith'
                }),
                headers: {
                    'content-type': 'application/json'
                },
            }
        );
        let validToken = JSON.parse(register.getBody() as string).token;
        validToken = validToken + '1'; // appended to string
        const res = request(
            'POST',
            SERVER_URL + '/auth/logout/v2',
            {
                body: JSON.stringify({}),
                headers: {
                    'content-type': 'application/json',
                    'token': validToken
                },
            }
        );
        expect(res.statusCode).toEqual(403);
    });
});

//////////////////////////////////////////////////////
// ITERATION 1 TESTS 
/*
describe('Testing authLoginV1', () => {
  test.each([
    {
      email: 'user1.doe@gmail.com',
      password: 'babushka',
      nameFirst: 'John',
      nameLast: 'Doe',
      expected: { authUserId: 1 }
    },
    {
      email: 'user1.boy@gmail.com',
      password: 'securePassword',
      nameFirst: 'Big',
      nameLast: 'Boy',
      expected: { authUserId: 1 }
    },
    {
      email: 'user1.thesandenator@hotmail.com',
      password: 'S0muchSand',
      nameFirst: 'Mary',
      nameLast: 'Sand',
      expected: { authUserId: 1 }
    },
  ])('Testing authLoginV1', ({ email, , nameFirst, nameLast, expected }) => {
    request('DELETE', SERVER_URL + '/clear/v1');
    authRegisterV1(email, puser1, nameFirst, nameLast);
    expect(authLoginV1(email, puser1)).toMatchObject(expected);
  });
});

describe('Testing authRegisterV1', () => {
  test.each([
    {
      email: 'user1@gmail.com',
      password: 'youShallNotPass',
      nameFirst: 'Hello',
      nameLast: 'World',
      expected: { authUserId: 1 }
    },
    {
      email: 'user1!@hotmail.com',
      password: 'najfsks2342',
      nameFirst: '49482',
      nameLast: '29834',
      expected: { authUserId: 1 }
    },
  ])('Testing authRegisterV1 success cases', ({ email, , nameFirst, nameLast, expected }) => {
    request('DELETE', SERVER_URL + '/clear/v1');
    expect(authRegisterV1(email, puser1, nameFirst, nameLast)).toMatchObject(expected);
  });

  test('Already used email - ', () => {
    request('DELETE', SERVER_URL + '/clear/v1');
    const email = .thesandenator@hotmail.com';
    const password = 'T00muchSand';
    const nameFirst = 'Melissa';
    const nameLast = 'Sand';
    const expected = { error: 'error' };
    authRegisterV1(email, puser1, nameFirst, nameLast);
    expect(authRegisterV1(email, puser1, nameFirst, nameLast)).toMatchObject(expected);
  });

  test('Short password - authRegister', () => {
    request('DELETE', SERVER_URL + '/clear/v1');
    const email = @.com';
    const password = 'he';
    const nameFirst = 'Valid';
    const nameLast = 'email'; expected = { error: 'error' };
    expect(authRegisterV1(email, puser1, nameFirst, nameLast)).toMatchObject(expected);
  });

  test('Long nameLast - authRegister', () => {
    request('DELETE', SERVER_URL + '/clear/v1');
    const email = @.com';
    const password = 'helloworld';
    const nameFirst = 'Valid';
    const nameLast = 'moreThanFiftyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const expected = { error: 'error' };
    expect(authRegisterV1(email, puser1, nameFirst, nameLast)).toMatchObject(expected);
  });

  test('Short nameFirst - authRegister', () => {
    request('DELETE', SERVER_URL + '/clear/v1');
    const email = @.com';
    const password = 'helloworld';
    const nameFirst = '';
    const nameLast = 'email'; expected = { error: 'error' };
    expect(authRegisterV1(email, puser1, nameFirst, nameLast)).toMatchObject(expected);
  });
});
*/
//////////////////////////////////////////////////////