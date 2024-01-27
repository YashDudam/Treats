import { requestAuthRegister, requestClear } from './requests';

describe('auth/register/v3', () => {
  beforeEach(() => {
    requestClear();
  });
  afterEach(() => {
    requestClear();
  });

  test('everything valid without any changes to the handle required.', () => {
    const res = requestAuthRegister('darth.vader@gmail.com', 'nooooooooo', 'darth', 'vader');
    expect(res.body).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(res.status).toBe(200);
  });

  test('handle casted to lowercase alphanumeric and longer than 20 characters but handle is taken', () => {
    requestAuthRegister('darth.vader@gmail.com', 'yessssssss', 'bigman', 'vadey');
    const res = requestAuthRegister('darth2.vader@gmail.com', 'noooooooo', 'bigman', 'vadey');
    expect(res.body).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(res.status).toBe(200);
  });

  test('handle casted to lowercase alphanumeric, needs to be shortened to 20 and handle is taken but adding a number exceeds 20 characters', () => {
    requestAuthRegister('darth.vader@gmail.com', 'yessssssss', 'bigmandarth', 'vadeyboy123');
    const res = requestAuthRegister('darth2.vader@gmail.com', 'noooooooo', 'bigmandarth', 'vadeyboy123');
    expect(res.body).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(res.status).toBe(200);
  });

  test('invalid email', () => {
    const res = requestAuthRegister('darth.vader.gmail.com', 'invalid', 'Darth', 'Vader');
    expect(res.status).toBe(400);
  });

  test('email already in use', () => {
    requestAuthRegister('darth.vader@gmail.com', 'yessssss', 'anakin', 'skywalker');
    const res = requestAuthRegister('darth.vader@gmail.com', 'nooooooooo', 'darth', 'vader');
    expect(res.status).toBe(400);
  });

  test('password too short', () => {
    const res = requestAuthRegister('anakin.skywalker@gmail.com', 'lol', 'anakin', 'skywalker');
    expect(res.status).toBe(400);
  });

  test('length of nameFirst is empty', () => {
    const res = requestAuthRegister('anakin.skywalker@gmail.com', 'yesssssss', '', 'skywalker');
    expect(res.status).toBe(400);
  });

  test('length of nameFirst is larger than 50 characters', () => {
    const res = requestAuthRegister('anakin.skywalker@gmail.com', 'dfalksdjfj', 'anakinthisnameisfartoolongwhatareyouthinkingbrowecannothandlethislength', 'skywalker');
    expect(res.status).toBe(400);
  });

  test('length of nameLast is empty', () => {
    const res = requestAuthRegister('anakin.skywalker@gmail.com', 'dfalksdjfj', 'anakin', '');
    expect(res.status).toBe(400);
  });

  test('length of nameLast is larger than 50 characters', () => {
    const res = requestAuthRegister('anakin.skywalker@gmail.com', 'dfalksdjfj', 'anakin', 'anakinthisnameisfartoolongwhatareyouthinkingbrowecannothandlethislength');
    expect(res.status).toBe(400);
  });
});
