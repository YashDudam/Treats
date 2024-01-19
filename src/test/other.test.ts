import { requestClear } from '../requests';
import { clearV1 } from './../other';

const OK = 200;

describe('Testing clearV1 function', () => {
  test('testing function with empty dataStore', () => {
    expect(clearV1()).toStrictEqual({});
  });
});

describe('Testing /clear/v1 route', () => {
  test('Testing success case', () => {
    const request = requestClear()
    expect(request.result).toStrictEqual({});
    expect(request.statusCode).toStrictEqual(OK);
  });
});