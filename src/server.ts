import express from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import { dmCreateV1, dmDetailsV1, dmLeaveV1, dmListV1, dmMessagesV1, dmRemoveV1 } from './dm';
import { validateToken, tokenToUId, clearV1, throwError } from './other';
import { authLoginV1, authRegisterV1 } from './auth';
import {
  userProfileV2, usersViewAllV1, userSetNameV1,
  userSetEmailV1, userSetHandleStrV1, userStatsV1
} from './users';
import { channelsCreateV1, channelsListV1, channelsListallV1 } from './channels';
import {
  channelInviteV1, channelLeaveV1, channelAddOwnerV1, channelRemoveOwnerV1,
  channelJoinV1, channelDetailsV1, channelMessagesV2
} from './channel';
import { messageSendV1, messageSenddmV1, messageEditV1, messageRemoveV1 } from './message';
import { standupStartV1, standupActiveV1, standupSendV1 } from './standup';
import errorHandler from 'middleware-http-errors';
import HTTPError from 'http-errors';
import { adminUserRemoveV1, adminUserpermissionChangeV1 } from './admin';
import { getData, setData, Token } from './dataStore';
import hash from 'object-hash';

// Set up web app, use JSON
const app = express();
app.use(express.json());

// Use middleware that allows for access from other domains
app.use(cors());

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

app.use(morgan('dev'));

// Example get request
app.get('/echo', (req, res, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

// ITERATION 2 functions (updated)
// Auth
app.post('/auth/login/v3', (req, res, next) => {
  try {
    const { email, password } = req.body;
    const id = authLoginV1(email, password);

    if ('error' in id) throw HTTPError(400, 'Invalid email or password');

    // Add token to header
    res.set('token', id.token);
    return res.json({
      token: id.token,
      authUserId: id.authUserId
    });
  } catch (err) {
    next(err);
  }
});

app.post('/auth/register/v3', (req, res, next) => {
  try {
    const email = req.body.email as string;
    const password = req.body.password as string;
    const nameFirst = req.body.nameFirst as string;
    const nameLast = req.body.nameLast as string;

    const id = authRegisterV1(email, password, nameFirst, nameLast);

    if ('error' in id) throw HTTPError(400, 'Invalid details');

    // Add token to header
    res.set('token', id.token);

    return res.json({
      authUserId: id.authUserId,
      token: id.token
    });
  } catch (err) {
    next(err);
  }
});

app.post('/auth/logout/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');

    // Find and remove token
    const data = getData();
    const tokenIndex = data.tokens.findIndex((tokenObj: Token) => tokenObj.token === hash(token));
    data.tokens.splice(tokenIndex, 1);

    setData(data);
    return res.json({});
  } catch (err) {
    next(err);
  }
});

// Channels
app.post('/channels/create/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    const name = req.body.name as string;
    const isPublic = req.body.isPublic as boolean;
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const id = tokenToUId(token) as number;
    const channelId = channelsCreateV1(id, name, isPublic);
    // https://blog.logrocket.com/how-to-use-type-guards-typescript/
    if ('error' in channelId) throw HTTPError(400, channelId.error);
    return res.json(channelId);
  } catch (err) {
    next(err);
  }
});

app.get('/channels/list/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const id = tokenToUId(token) as number;
    const givenList = channelsListV1(id);
    return res.json(givenList);
  } catch (err) {
    next(err);
  }
});

app.get('/channels/listall/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const id = tokenToUId(token) as number;
    const givenList = channelsListallV1(id);
    return res.json(givenList);
  } catch (err) {
    next(err);
  }
});

// Channel
app.get('/channel/details/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.query.channelId as string);

    // Validate token, 2nd statement should not throw an error
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const authUserId = tokenToUId(token) as number;

    // Call function
    const result = channelDetailsV1(authUserId, channelId);
    // Throw 400 unless otherwise specified
    if ('error' in result) {
      throwError([{ code: 403, errorMessage: 'User is not in channel' }], result.error);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/join/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.body.channelId as string);

    // Validate token, 2nd statement should not throw an error
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const authUserId = tokenToUId(token) as number;

    // Call function
    const result = channelJoinV1(authUserId, channelId);

    // Throw error 400 unless otherwise specified
    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'Joining private channel without global permissions'
      }], result.error);
    }

    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.post('/channel/invite/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    const channelId = req.body.channelId as number;
    const uId = req.body.uId as number;

    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const authUserId = tokenToUId(token) as number;
    const result = channelInviteV1(authUserId, channelId, uId);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'Inviter is not in the channel'
      }], result.error);
    }

    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.get('/channel/messages/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    const channelId = req.query.channelId as string;
    const start = req.query.start as string;
    const result = channelMessagesV2(token, parseInt(channelId), parseInt(start));
    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a channel member'
      }], result.error);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/leave/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const channelId = req.body.channelId as number;
    const authUserId = tokenToUId(token) as number;
    const result = channelLeaveV1(authUserId, channelId);
    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a channel member'
      }], result.error);
    }
    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.post('/channel/addowner/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const channelId = req.body.channelId as number;
    const uId = req.body.uId as number;
    const authUserId = tokenToUId(token) as number;
    const result = channelAddOwnerV1(authUserId, channelId, uId);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a channel owner'
      }], result.error);
    }

    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.post('/channel/removeowner/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const channelId = req.body.channelId as number;
    const uId = req.body.uId as number;
    const authUserId = tokenToUId(token) as number;
    const result = channelRemoveOwnerV1(authUserId, channelId, uId);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'authUser does not have owner permissions'
      }], result.error);
    }

    return res.json({});
  } catch (err) {
    next(err);
  }
});

// User
app.get('/user/profile/v3', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const uId = parseInt(req.query.uId as string) as number;
    const profile = userProfileV2(token, uId);
    if ('error' in profile) throw HTTPError(400, 'Invalid uId');
    return res.json(profile);
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setname/v2', (req, res, next) => {
  try {
    const { nameFirst, nameLast } = req.body;
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');

    const result = userSetNameV1(token, nameFirst, nameLast);
    if ('error' in result) throw HTTPError(400, result.error);
    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setemail/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const email = req.body.email as string;
    const result = userSetEmailV1(token, email);
    if ('error' in result) throw HTTPError(400, result.error);
    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/sethandle/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const handleStr = req.body.handleStr as string;
    const result = userSetHandleStrV1(token, handleStr);
    if ('error' in result) throw HTTPError(400, result.error);
    return res.json({});
  } catch (err) {
    next(err);
  }
});

// Clear
app.delete('/clear/v1', (req, res, next) => {
  return res.json(clearV1());
});

// Message
app.post('/message/send/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    const channelId = req.body.channelId;
    const message = req.body.message;
    const result = messageSendV1(token, parseInt(channelId), message);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a channel member'
      }], result.error);
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.put('/message/edit/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    const { messageId, message } = req.body;
    const result = messageEditV1(token, parseInt(messageId), message);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not an owner and message is not theirs'
      }], result.error);
    }

    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.delete('/message/remove/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    const messageId = req.query.messageId as string;
    const result = messageRemoveV1(token, parseInt(messageId));

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not an owner and message is not theirs'
      }], result.error);
    }

    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.post('/message/senddm/v2', (req, res, next) => {
  try {
    const { dmId, message } = req.body;
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');

    const result = messageSenddmV1(token, dmId, message);
    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a dm member'
      }], result.error);
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// Dm
app.post('/dm/create/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    const { uIds } = req.body;
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');

    const authUserId = tokenToUId(token) as number;
    const result = dmCreateV1(authUserId, uIds);
    if ('error' in result) throw HTTPError(400, result.error);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/dm/list/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const authUserId = tokenToUId(token) as number;
    return res.json(dmListV1(authUserId));
  } catch (err) {
    next(err);
  }
});

app.delete('/dm/remove/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const dmId = parseInt(req.query.dmId as string);
    const authUserId = tokenToUId(token) as number;
    const result = dmRemoveV1(authUserId, dmId);

    // Default error code is 403, unless the dmID is invalid
    if ('error' in result) {
      throwError([{
        code: 400,
        errorMessage: 'Invalid dmId',
      }], result.error, 403);
    }
    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.get('/dm/details/v2', (req, res, next) => {
  try {
    const dmId = parseInt(req.query.dmId as string);
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');

    const authUserId = tokenToUId(token) as number;
    const result = dmDetailsV1(authUserId, dmId);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a dm member'
      }], result.error);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/dm/leave/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    const dmId = req.body.dmId as number;
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');

    const authUserId = tokenToUId(token) as number;
    const result = dmLeaveV1(authUserId, dmId);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a dm member'
      }], result.error);
    }
    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.get('/dm/messages/v2', (req, res, next) => {
  try {
    const dmId = parseInt(req.query.dmId as string);
    const start = parseInt(req.query.start as string);
    const token = req.header('token');

    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const authUserId = tokenToUId(token) as number;
    const result = dmMessagesV1(authUserId, dmId, start);

    if ('error' in result) {
      throwError([{
        code: 403,
        errorMessage: 'User is not a dm member'
      }], result.error);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// Users
app.get('/users/all/v2', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    return res.json(usersViewAllV1());
  } catch (err) {
    next(err);
  }
});

app.get('/user/stats/v1', (req, res, next) => {
  try {
    const token = req.header('token');
    return res.json(userStatsV1(token));
  } catch (err) {
    next(err);
  }
});

app.delete('/admin/user/remove/v1', (req, res, next) => {
  try {
    const token = req.header('token');
    const uId = req.query.uId as string;
    res.json(adminUserRemoveV1(token, parseInt(uId)));
  } catch (err) {
    next(err);
  }
});
// Standup
app.post('/standup/start/v1', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const channelId = req.body.channelId as number;
    const length = req.body.length as number;
    const result = standupStartV1(channelId, length, token);
    if ('error' in result) {
      throw HTTPError(result.error.code, result.error.message);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/standup/send/v1', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const channelId = req.body.channelId as number;
    const message = req.body.message as string;
    const result = standupSendV1(channelId, message, token);
    if ('error' in result) {
      throw HTTPError(result.error.code, result.error.message);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/standup/active/v1', (req, res, next) => {
  try {
    const token = req.header('token');
    if (!validateToken(token)) throw HTTPError(403, 'Invalid token');
    const channelId = parseInt(req.query.channelId as string);
    const result = standupActiveV1(channelId, token);
    if ('error' in result) {
      throw HTTPError(result.error.code, result.error.message);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/admin/userpermission/change/v1', (req, res, next) => {
  try {
    const token = req.header('token');
    const { uId, permissionId } = req.body;
    return res.json(adminUserpermissionChangeV1(token, parseInt(uId), parseInt(permissionId)));
  } catch (err) {
    next(err);
  }
});

// handles errors nicely
app.use(errorHandler());

// for logging errors

// start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
