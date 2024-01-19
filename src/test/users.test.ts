import { authRegisterV1 } from './../auth';
import { authUserIdType } from './../types';
import {clearV1, getUNIXTime} from '../other'
import request from 'sync-request'
import config from '../config.json'
import {getData} from '../dataStore'
import {usersViewAllV1, userProfileV2} from '../users'
import { requestAuthRegister, requestChannelInvite, requestChannelJoin, requestChannelLeave, requestChannelsCreate, requestClear, requestDmCreate, requestMessageRemove, requestMessageSend, requestUserStats } from '../requests';

// const leon = () => { const data = getData(); console.log(data)}
const OK = 200;

const data = getData();
clearV1();
// describe('userProfileV1 Tests', () => {
//   // setting up valid user id for the tests
//   const validAuthUserId = authRegisterV1(
//     'valid_authUserId@valid.com', 'password', 'Valid', 'authUserId'
//   ) as authUserIdType;
//   const validUId = authRegisterV1(
//     'valid_uId@valid.com', 'password', 'valid', 'uId'
//   ) as authUserIdType;
//     // Assuming that the previous constants are valid
//   test('Normal Test', () => {
//     expect(userProfileV1(validAuthUserId.authUserId, validUId.authUserId))
//       .toStrictEqual(expect.objectContaining({
//         uId: validAuthUserId.authUserId,
//         email: expect.any(String), // idk how to have it as detect email
//         nameFirst: expect.any(String),
//         nameLast: expect.any(String),
//         handleStr: expect.any(String), // the handlestr is the first and lastname joined (added) in lowercase
//       }));
//   });
//   test('Invalid authUserId', () => {
//     expect(userProfileV1(-1, validUId.authUserId))
//       .toEqual({ error: 'error' });
//   });
//   test('Invalid uId', () => {
//     expect(userProfileV1(validAuthUserId.authUserId, -1))
//       .toEqual({ error: 'error' });
//   });
//   test('Invalid authUserId & uId', () => {
//     expect(userProfileV1(-1, -1))
//       .toEqual({ error: 'error' });
//   });
// });

//////////////////////////////////////////////////////////////////////////////////////////

const req = require('sync-request')
let SERVER_URL = `${config.url}:${config.port}`

/////////////////////////////////////////////

describe('user/profile/v3', () => {
  let kenobi: authUserIdType, anakin: authUserIdType, palpatine: authUserIdType

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'obiwan@gmail.com',
          password: 'highground',
          nameFirst: 'obiwan',
          nameLast: 'kenobi'
        }
      }
    );
    kenobi = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'darthvader@gmail.com',
          password: 'ihatesand',
          nameFirst: 'anakin',
          nameLast: 'skywalker'
        }
      }
    );
    anakin = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'thesenate@gmail.com',
          password: 'sideous',
          nameFirst: 'sheev',
          nameLast: 'palpatine'
        }
      }
    );
    palpatine = JSON.parse(res.getBody() as string);
  });

	test('Success', () => {
		//The requiered response
		const res = request(
			'GET', //get test
				SERVER_URL + '/user/profile/v3',
			{
				qs: { //the input essentially
					uId:anakin.authUserId
				},
        headers: {
          'token': kenobi.token
        }
			}
		)
    expect(res.statusCode).toEqual(200)
		const bodyObj = JSON.parse(res.getBody() as string) //unsure of this part
		expect(bodyObj).toStrictEqual({
      user: {
        uId: expect.any(Number),
        nameFirst: expect.any(String),
        nameLast: expect.any(String),
        handleStr: expect.any(String),
        email: expect.any(String)
		  }
    });
  });

  test('Invalid token', () => {
		const res = request(
			'GET',
				SERVER_URL + '/user/profile/v3',
			{
				qs: { //the input essentially
					uId: anakin.authUserId
				},
        headers: {
          token: '00000'
        }
			}
		);
    expect(res.statusCode).toEqual(403);
  });

  test('Invalid uId', () => {
		const res = request(
			'GET',
				SERVER_URL + '/user/profile/v3',
			{
				qs: { //the input essentially
					uId: -1
				},
        headers: {
          token: palpatine.token
        }
			}
		)
    expect(res.statusCode).toEqual(400);
  });
});

describe('users/all/v2', () => {
  let kenobi: authUserIdType, anakin: authUserIdType, palpatine: authUserIdType

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'obiwan@gmail.com',
          password: 'highground',
          nameFirst: 'obiwan',
          nameLast: 'kenobi'
        }
      }
    );
    kenobi = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'darthvader@gmail.com',
          password: 'ihatesand',
          nameFirst: 'anakin',
          nameLast: 'skywalker'
        }
      }
    );
    anakin = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'thesenate@gmail.com',
          password: 'sideous',
          nameFirst: 'sheev',
          nameLast: 'palpatine'
        }
      }
    );
    palpatine = JSON.parse(res.getBody() as string);
  });

  test('Success', () => {
		const res = request(
			'GET',
      SERVER_URL + '/users/all/v2', //calls upon the users_viewAll_V1
      {
        headers: {
          'token': kenobi.token
        }
      }
		);
    expect(res.statusCode).toEqual(200);
		const bodyObj = JSON.parse(res.getBody() as string);
		expect(bodyObj).toEqual({
      users: [
        {"email": "obiwan@gmail.com", "handleStr": "obiwankenobi", "nameFirst": "obiwan", "nameLast": "kenobi", "uId": kenobi.authUserId}, 
        {"email": "darthvader@gmail.com", "handleStr": "anakinskywalker", "nameFirst": "anakin", "nameLast": "skywalker", "uId": anakin.authUserId}, 
        {"email": "thesenate@gmail.com", "handleStr": "sheevpalpatine", "nameFirst": "sheev", "nameLast": "palpatine", "uId": palpatine.authUserId}
      ]
    });
	});

  test('Invalid token', () => {
		const res = request(
			'GET',
      SERVER_URL + '/users/all/v2',
      {
        headers: {
          'token': '-1'
        }
      }
		)
		expect(res.statusCode).toEqual(403);
	});
});

describe('user/profile/setname/v2', () => {
  let kenobi: authUserIdType, anakin: authUserIdType, palpatine: authUserIdType;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'obiwan@gmail.com',
          password: 'highground',
          nameFirst: 'obiwan',
          nameLast: 'kenobi'
        }
      }
    );
    kenobi = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'darthvader@gmail.com',
          password: 'ihatesand',
          nameFirst: 'anakin',
          nameLast: 'skywalker'
        }
      }
    );
    anakin = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'thesenate@gmail.com',
          password: 'sideous',
          nameFirst: 'sheev',
          nameLast: 'palpatine'
        }
      }
    );
    palpatine = JSON.parse(res.getBody() as string);
  });

  //anakin changing his name
  test('Success', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setname/v2',
      {
        body: JSON.stringify({
          nameFirst: 'Darth',
          nameLast: 'Vader'
        }),
        headers: {
          'content-type': 'application/json',
          'token': anakin.token
        }
      }
    );
    expect(res.statusCode).toEqual(200) 
    const setnameObj = JSON.parse(res.getBody() as string)
    expect(setnameObj).toStrictEqual({}) 
  });
  
  test('Invalid token', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setname/v2',
      {
        body: JSON.stringify({
          nameFirst: 'Darth',
          nameLast: 'Vader'
        }),
        headers: {
            'content-type': 'application/json',
            'token': '-1'
        }
      }
    )
    expect(res.statusCode).toEqual(403);
  });

  test('Invalid nameFirst', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setname/v2',
      {
        body: JSON.stringify({
          nameFirst: '',
          nameLast: 'Vader'
        }),
        headers: {
          'content-type': 'application/json',
          'token': anakin.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);
  });

  test('Invalid nameLast', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setname/v2',
      {
        body: JSON.stringify({
          nameFirst: 'Darth',
          nameLast: ''
        }),
        headers: {
          'content-type': 'application/json',
          'token': anakin.token,
        }
      }
    )
    expect(res.statusCode).toEqual(400);
  });
});

describe('user/profile/setemail/v2', () => {
  let kenobi: authUserIdType, anakin: authUserIdType, palpatine: authUserIdType;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'obiwan@gmail.com',
          password: 'highground',
          nameFirst: 'obiwan',
          nameLast: 'kenobi'
        }
      }
    );
    kenobi = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'darthvader@gmail.com',
          password: 'ihatesand',
          nameFirst: 'anakin',
          nameLast: 'skywalker'
        }
      }
    );
    anakin = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'thesenate@gmail.com',
          password: 'sideous',
          nameFirst: 'sheev',
          nameLast: 'palpatine'
        }
      }
    );
    palpatine = JSON.parse(res.getBody() as string);
  });

  test('Success', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setemail/v2',
      {
        body: JSON.stringify({
          email: 'deathStart@gmail.com'
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const emailObj = JSON.parse(res.getBody() as string);
    expect(emailObj).toStrictEqual({});
  });

  test('Invalid token', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setemail/v2',
      {
        body: JSON.stringify({
          email: 'deathStart@gmail.com'
        }),
        headers: {
          'content-type': 'application/json',
          'token': '-1'
        }
      }
    )
    expect(res.statusCode).toEqual(403);    
  });

  test('Invalid email', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setemail/v2',
      {
        body: JSON.stringify({
          email: ''
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    )
    expect(res.statusCode).toEqual(400);    
  });

  test('Email already exists', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/setemail/v2',
      {
        body: JSON.stringify({
          email: 'obiwan@gmail.com'
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    )
    expect(res.statusCode).toEqual(400);
  });
});

describe('user/profile/sethandle/v2', () => {
  let kenobi: authUserIdType, anakin: authUserIdType, palpatine: authUserIdType;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1');
    let res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'obiwan@gmail.com',
          password: 'highground',
          nameFirst: 'obiwan',
          nameLast: 'kenobi'
        }
      }
    );
    kenobi = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'darthvader@gmail.com',
          password: 'ihatesand',
          nameFirst: 'anakin',
          nameLast: 'skywalker'
        }
      }
    );
    anakin = JSON.parse(res.getBody() as string);
    res = request(
      'POST',
      SERVER_URL + '/auth/register/v3',
      {
        json: {
          email: 'thesenate@gmail.com',
          password: 'sideous',
          nameFirst: 'sheev',
          nameLast: 'palpatine'
        }
      }
    );
    palpatine = JSON.parse(res.getBody() as string);
  });

  test('Success', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/sethandle/v2',
      {
        body: JSON.stringify({
          handleStr: 'lastSith'
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    );
    expect(res.statusCode).toEqual(200);
    const handleObj = JSON.parse(res.getBody() as string)
    expect(handleObj).toStrictEqual({})
  });

  test('Invalid token', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/sethandle/v2',
      {
        body: JSON.stringify({
          handleStr: 'lastSith'
        }),
        headers: {
          'content-type': 'application/json',
          'token': '-1'
        }
      }
    );
    expect(res.statusCode).toEqual(403);
  });

  test('handleStr too short', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/sethandle/v2',
      {
        body: JSON.stringify({
          handleStr: ''
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);     
  })
  test('handleStr too long', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/sethandle/v2',
      {
        body: JSON.stringify({
          handleStr: 'uvuvwevwevweonyetenyevweugwemubwemossas'
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);  
  });

  test('non-alphanumeric characters', () => {
    const res = request(
      'PUT',
      SERVER_URL + '/user/profile/sethandle/v2',
      {
        body: JSON.stringify({
          handleStr: 'l@$t$1th'
        }),
        headers: {
          'content-type': 'application/json',
          'token': palpatine.token
        }
      }
    );
    expect(res.statusCode).toEqual(400);  
  });
});

describe('user/stats/v1', () => {
  beforeEach(() => {
    requestClear();
  });
  afterEach(() => {
    requestClear();
  });
  
  test('success case', () => {
    const anakin = requestAuthRegister('anakin@gmail.com', 'bcxvm,', 'anakin', 'skywalker');
    const palpatine = requestAuthRegister('palpatine@gmail.com', 'qiuyert', 'sheev', 'palpatine');
    const kenobi = requestAuthRegister('kenobi@gmail.com', 'xcmnvb', 'obiwan', 'kenobi');
    const mace = requestAuthRegister('windu@gmail.com', 'x,cmnvbmx,cv', 'mace', 'windu');
    const channel = requestChannelsCreate(palpatine.token, 'Sith bros', false);
    requestChannelInvite(palpatine.token, channel.channelId, anakin.authUserId);
    const bros = requestChannelsCreate(anakin.token, 'Broskis', true);
    requestChannelJoin(mace.token, bros.channelId);
    requestChannelInvite(anakin.token, bros.channelId, kenobi.authUserId);
    requestDmCreate(kenobi.token, [anakin.authUserId]).data;
    requestMessageSend(anakin.token, channel.channelId, 'Hello there');
    const res = requestMessageSend(anakin.token, channel.channelId, 'Hello again');
    const message = JSON.parse(String(res.getBody()));
    requestMessageRemove(anakin.token, message.messageId);
    requestChannelLeave(anakin.token, channel.channelId);
    const result = requestUserStats(anakin.token);
    expect(result.data).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 2,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 2,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: 0.75,
      }
    });
    expect(result.statusCode).toStrictEqual(OK);
  });
});
