// Use this file to create request functions to be used in testing
import request from 'sync-request';
import config from './config.json';

export const SERVER_URL = `${config.url}:${config.port}`;

/* Iteration 2 request functions */
export const requestMessageSendDm = (token: string, dmId: number, message: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/message/senddm/v2',
    {
      body: JSON.stringify({
        dmId: dmId,
        message: message
      }),
      headers: {
        'content-type': 'application/json',
        token: token
      },
    }
  );
  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestClear = () => {
  const res = request(
    'DELETE',
    SERVER_URL + '/clear/v1'
  );
  const ret = {
    result: JSON.parse(res.getBody() as string),
    statusCode: res.statusCode,
  };
  return ret;
};

export const requestMessageSend = (token: string, channelId: number, message: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/message/send/v2',
    {
      body: JSON.stringify({
        channelId: channelId,
        message: message
      }),
      headers: {
        'content-type': 'application/json',
        token: token
      }
    }
  );
  return res;
};

export const requestChannelsCreate = (token: string, name: string, isPublic: boolean) => {
  const res = request(
    'POST',
    SERVER_URL + '/channels/create/v3',
    {
      body: JSON.stringify({
        name: name,
        isPublic: isPublic
      }),
      headers: {
        'content-type': 'application/json',
        token: token
      },
    }
  );
  return JSON.parse(res.getBody() as string);
};

export const requestAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/auth/register/v3',
    {
      body: JSON.stringify({
        email: email,
        password: password,
        nameFirst: nameFirst,
        nameLast: nameLast,
      }),
      headers: {
        'content-type': 'application/json',
      },
    }
  );
  return JSON.parse(String(res.getBody()));
};

export const requestChannelMessages = (token: string, channelId: number, start: number) => {
  const res = request(
    'GET',
    SERVER_URL + '/channel/messages/v3',
    {
      qs: {
        channelId: channelId,
        start: start,
      },
      headers: {
        token: token
      }
    }
  );

  if (res.statusCode !== 200) return { statusCode: res.statusCode };

  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestMessageEdit = (token: string, messageId: number, message: string) => {
  const res = request(
    'PUT',
    SERVER_URL + '/message/edit/v2',
    {
      body: JSON.stringify({
        messageId: messageId,
        message: message,
      }),
      headers: {
        'content-type': 'application/json',
        token: token
      },
    }
  );

  if (res.statusCode !== 200) return { statusCode: res.statusCode };

  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestChannelInvite = (token: string, channelId: number, uId: number) => {
  const res = request(
    'POST',
    SERVER_URL + '/channel/invite/v3',
    {
      body: JSON.stringify({
        channelId: channelId,
        uId: uId
      }),
      headers: {
        'content-type': 'application/json',
        token: token
      },
    }
  );
  return JSON.parse(String(res.getBody()));
};

export const requestDmCreate = (token: string, uIds: number[]) => {
  const res = request(
    'POST',
    SERVER_URL + '/dm/create/v2',
    {
      body: JSON.stringify({
        uIds: uIds
      }),
      headers: {
        'content-type': 'application/json',
        token: token
      },
    }
  );

  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestMessageRemove = (token: string, messageId: number) => {
  const res = request(
    'DELETE',
    SERVER_URL + '/message/remove/v2',
    {
      qs: {
        messageId: messageId,
      },
      headers: {
        token: token
      }
    }
  );

  if (res.statusCode !== 200) return { statusCode: res.statusCode };

  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestChannelJoin = (token: string, channelId: number) => {
  const res = request(
    'POST',
    SERVER_URL + '/channel/join/v3',
    {
      body: JSON.stringify({
        channelId: channelId,
      }),
      headers: {
        'content-type': 'application/json',
        token: token,
      }
    }
  );

  return JSON.parse(String(res.getBody()));
};

export const requestChannelLeave = (token: string, channelId: number) => {
  request(
    'POST',
    SERVER_URL + '/channel/leave/v2',
    {
      body: JSON.stringify({
        channelId: channelId,
      }),
      headers: {
        'content-type': 'application/json',
        token: token,
      }
    }
  );
};

export const requestUserStats = (token: string) => {
  const res = request(
    'GET',
    SERVER_URL + '/user/stats/v1',
    {
      headers: {
        token: token,
      },
    }
  );
  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestAdminUserRemove = (token: string, uId: number) => {
  const res = request(
    'DELETE',
    SERVER_URL + '/admin/user/remove/v1',
    {
      qs: {
        uId: uId,
      },
      headers: {
        token: token,
      },
    }
  );

  if (res.statusCode !== 200) {
    return { statusCode: res.statusCode };
  }

  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};

export const requestAdminUserpermissionChange = (token: string, uId: number, permissionId: number) => {
  const res = request(
    'POST',
    SERVER_URL + '/admin/userpermission/change/v1',
    {
      body: JSON.stringify({
        uId: uId,
        permissionId: permissionId,
      }),
      headers: {
        'content-type': 'application/json',
        token: token,
      },
    }
  );

  if (res.statusCode !== 200) {
    return { statusCode: res.statusCode };
  }

  return {
    data: JSON.parse(String(res.getBody())),
    statusCode: res.statusCode,
  };
};
