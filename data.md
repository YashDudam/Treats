Data structure design for users and channels

let dataStore = {
    userData: [
        {
            uId: 1,
            handle: 'johndoe',
            nameFirst: 'John',
            nameLast: 'Doe',
            email: 'john.doe@gmail.com',
            password: '5trongPassword',
            permission: 1,
        },

    ],
    channelData: [
        {
            channelId: 1,
            channelName: "Channel 1",
            isPublic: true,
            ownerMembers: [
                {
                    uId: 1,
                    handleStr: 'johndoe',
                    nameLast: 'Doe',
                    nameFirst: 'John',
                    email: 'john.doe@gmail.com',
                },
            ],
            allMembers: [
                {
                    uId: 1,
                    handleStr: 'johndoe',
                    nameFirst: 'John',
                    nameLast: 'Doe',
                    email: 'john.doe@gmail.com',
                },
            ],
            messages: [
                {
                    messageId: 0
                    uId: 1,
                    message: 'Hello there!',
                    timeSent: 1655954642,
                },
            ],

        },
    ],
}