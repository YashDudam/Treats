import request from 'sync-request';
import config from '../config.json';
import { standupStartV1, standupActiveV1, standupSendV1 } from '../standup';
import { clearV1, getUNIXTime } from '../other';

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
      headers: header,
    }
  );
  if (res.statusCode !== 200) return { statusCode: res.statusCode };
  const bodyObj = JSON.parse(String(res.getBody()));
  return { body: bodyObj, statusCode: res.statusCode };
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
      headers: header,
    }
  );
  if (res.statusCode !== 200) return { statusCode: res.statusCode };
  const bodyObj = JSON.parse(String(res.getBody()));
  return {body: bodyObj, statusCode: res.statusCode};
};

// Clear data
beforeEach(() => {
  request('DELETE', `${config.url}:${config.port}` + '/clear/v1');
});

describe('standup/start/v1', () => {
  test('Success case', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    const result = post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 20,
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(200);
    expect(result.body).toStrictEqual({ timeFinish: expect.any(Number) });
  });

  test('Error: Invalid channelId', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    const result = post('standup/start/v1',
      {
        channelId: channel.body.channelId + 1000,
        length: 20,
      },
      register.body.token,
    );
    expect(result.statusCode).toStrictEqual(400);
  });

  test('Error: Invalid length', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    const result = post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: -100,
      },
      register.body.token,
    );
    expect(result.statusCode).toStrictEqual(400);
  });

  test('Error: Active standup already running in channel', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register.body.token,
    );
    const result = post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 20,
      },
      register.body.token,
    );
    expect(result.statusCode).toStrictEqual(400);
  });

  test('Error: valid channelId but authUser is not a member of channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      }
    );
    const register2 = post('auth/register/v3',
    {
      email: 'user2@email.com',
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
      register1.body.token
    );
    const result = post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register2.body.token
    );
    expect(result.statusCode).toStrictEqual(403);
  });
});

describe('standup/active/v1', () => {
  test('Success case', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register.body.token,
    );
    const result = get('standup/active/v1', 
      {
        channelId: channel.body.channelId,
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(200);
    expect(result.body).toStrictEqual({ isActive: true, timeFinish: expect.any(Number) });
  });

  test('Error: Invalid channelId', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register.body.token,
    );
    const result = get('standup/active/v1', 
      {
        channelId: channel.body.channelId + 1000,
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(400);
  });

  test('Error: valid channelId but authUser is not a member of channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      }
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
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
      register1.body.token
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register1.body.token
    );
    const result = get('standup/active/v1', 
      {
        channelId: channel.body.channelId,
      },
      register2.body.token
    );
    expect(result.statusCode).toEqual(403);
  });
});

describe('standup/send/v1', () => {
  test('Success case', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register.body.token,
    );
    const result = post('standup/send/v1', 
      {
        channelId: channel.body.channelId,
        message: 'first standup message',
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(200);
    expect(result.body).toStrictEqual({});
  });

  test('Error: Invalid channelId ', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register.body.token,
    );
    const result = post('standup/send/v1', 
      {
        channelId: channel.body.channelId + 1000,
        message: 'first standup message',
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(400);
  });

  test('Error: Invalid message lenngth (>1000 characters)', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register.body.token,
    );
    const result = post('standup/send/v1', 
      {
        channelId: channel.body.channelId + 1000,
        message: 'QZiff8YrrUsaIpeEAdOqANiaQJ0hE6TsauQI3pgDOrmRMX1VCZArzGtDnCAbJxZ829pPgGSbnSAiyZHXsoQsRRL6SCJ9XmYCKN7lrNCOMfyQMxOlr5FQujzH41q2OxBlG2Vksxja4hRbqxcpuLHvrzvwLdrlR5PpouqcyEXS69S10BbhpJGYuCwe88bCPxD5zPsXHfABbfcLrqTTiwWryAV48QfTxV3q9d5RZWcNcZQ2QFGozg1m1MBvawMcVWyITpDnxh0W6Osgagc1WAR8YQyOy9qnnbfP3bcKuHvB8rhHOO1f6mnrGECLSGk0m1yQpVLSWMI3ho50h9sliT0Q2pkhl36yC0NJZCL60JEKLiScOp2ZwMLY1NB7bYOrhdGekXwB2YJjNBtWFRf9iS8QEH5jtLfeXHyWwR5x8Q4SxDDURo4eF7CDxIKk3eWbYCGWnKEsQveunGN4gYci5DUW9De8NCEE8ayPeVLOJuLVj5xwf9XvSfqx6Cxdv6eL70kentO7Zx9ddKQn0ZWjbRflewUex3fUmucyaAzl5eVHdtSjNDkoqn1LpYuAPlDvMghMXnSQ9ZFwJcIWd3vzJjzyhC8NGxRLos1xN4wAaTYHvkNuOGMhBxBhsocVjOpTVxRwFxdNSCVkox9lomQaRhxYdNmf1qHwpsuNw9ZDnUnSD4zg9h1OR3LqcXtVPjLKqdioGDh1bgsutBePXZW7kmblPA45XypZ7mxmDUrPRXiejk75J7gNRRW88LveLd6rvWgFiTWEzgGP21lJ9pu6EAWrqw07RBPssjuLhWjPBFREnohXYZKhoyu8mPfu4m0T2qh44hKsGW58LYQ9cou9Pf9usKSBJ2E14gRqcovoLwoPKZrW1d0kUWqy8dclvU038nH3F6ziLEaPVFfHCTtR6rHuxYIBeZsV8luZ4xphObrPzc1MDYxTTooY93s3uYyeSUg6MZFyDCn3KRy3lg1rElLbQZPaFJ0gkptGorgRlvwE5Jnc68DH7G3Vby7RcWYg1z5wwNAfs3g50pPTDHAIopfC2rZWVF6w9fjFYRJqb8lgjVcrSSjCzelVuEyLUn5VyAe4bsrj3qxWTN27',
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(400);
  });

  test('Error: No active standups currently running in channel', () => {
    const register = post('auth/register/v3',
      {
        email: 'user1@email.com',
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
      register.body.token,
    );
    const result = post('standup/send/v1', 
      {
        channelId: channel.body.channelId,
        message: 'first standup message',
      },
      register.body.token,
    );
    expect(result.statusCode).toEqual(400);
  });

  test('Error: Valid channelId but authUser is not a member of channel', () => {
    const register1 = post('auth/register/v3',
      {
        email: 'user1@email.com',
        password: '5trongPassword',
        nameFirst: 'Yung',
        nameLast: 'Lean',
      }
    );
    const register2 = post('auth/register/v3',
      {
        email: 'user2@email.com',
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
      register1.body.token
    );
    post('standup/start/v1',
      {
        channelId: channel.body.channelId,
        length: 30,
      },
      register1.body.token
    );
    const result = post('standup/send/v1', 
      {
        channelId: channel.body.channelId,
        message: 'first standup message',
      },
      register2.body.token,
    );
    expect(result.statusCode).toEqual(403);
  });
});
