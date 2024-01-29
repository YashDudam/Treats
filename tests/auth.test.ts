import { requestAuthLogin, requestAuthRegister, requestClear } from './requests';

describe('auth/login/v3', () => {
  beforeEach(() => {
    requestClear();
  });
  afterEach(() => {
    requestClear();
  });

  test('correct email and password', () => {
    requestAuthRegister('darth.vader@gmail.com', 'bigmanvad3r', 'darth', 'vader');
    const res = requestAuthLogin('darth.vader@gmail.com', 'bigmanvad3r');
    expect(res.body).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(res.status).toBe(200);
  });

  test('two users with different emails but same passwords', () => {
    requestAuthRegister('darth.vader@gmail.com', 'bigmanvad3r', 'darth', 'vader');
    requestAuthRegister('anakin.skywalker@gmail.com', 'bigmanvad3r', 'anakin', 'vader');

    const vader = requestAuthLogin('darth.vader@gmail.com', 'bigmanvad3r');
    expect(vader.body).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(vader.status).toBe(200);

    const anakin = requestAuthLogin('anakin.skywalker@gmail.com', 'bigmanvad3r');
    expect(anakin.body).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(anakin.status).toBe(200);
  });

  test('email doesn\'t belong to a user', () => {
    requestAuthRegister('darth.vader@gmail.com', 'bigmanvad3r', 'darth', 'vader');
    const res = requestAuthLogin('anakin.skywalker@gmail.com', 'bigmanvad3r');
    expect(res.body).toStrictEqual({ error: 'email does not belong to a user' });
    expect(res.status).toBe(400);
  });

  test('incorrect password', () => {
    requestAuthRegister('darth.vader@gmail.com', 'bigmanvad3r', 'darth', 'vader');
    const res = requestAuthLogin('anakin.skywalker@gmail.com', 'bigmandarth');
    expect(res.body).toStrictEqual({ error: 'incorrect password' });
    expect(res.status).toBe(400);
  });
});

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
    requestAuthRegister('darth.vader@gmail.com', 'yessssssss', 'bigm@n', 'v@d3y');
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
