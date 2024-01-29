// a file that contains wrapper functions for api requests. Use these in testing
import request from 'sync-request';
import config from './../src/config.json';

const SERVER_URL = `${config.url}:${config.port}`;

type TestRequest = {
  body: object,
  status: number
}

// calls the clear endpoint to clear the data
export function requestClear() {
  request('DELETE', `${SERVER_URL}/clear/v1`);
}

// calls the /auth/login/v3 api endpoint
export function requestAuthLogin(email: string, password: string) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/login/v3',
    {
      body: JSON.stringify({ email, password }),
      headers: {
        'content-type': 'application/json'
      }
    }
  );

  return {
    body: JSON.parse(String(res.body)),
    status: res.statusCode
  };
}

// calls the /auth/register/v3 api endpoint
export function requestAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): TestRequest {
  const res = request(
    'POST',
    SERVER_URL + '/auth/register/v3',
    {
      body: JSON.stringify({ email, password, nameFirst, nameLast }),
      headers: {
        'content-type': 'application/json'
      }
    }
  );

  return {
    body: JSON.parse(String(res.body)),
    status: res.statusCode
  };
}
