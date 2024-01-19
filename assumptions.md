Iteration 1
CRUNCHIE
ASSUMPTIONS

1. It was assumed that authUserId is always a positive integer. 
2. It was assumed that the handle generated in authRegisterV1 is stored in the same object as the rest of the user data.
3. It was assumed that the string containing password only needs to be equal to or greater than 6 in length. It doesn't need to 
contain a numeral or a certain case of letter.
4. For channelsCreateV1 function: A user who creates a channel becomes an owner of that channel, not just join the channel automatically.
5. The channelDetailsV1 and channelJoinV1 functions both assume that the authUserId argument is a valid integer, not an object which is what is returned
for authRegister.
6. We have assumed that the 'password' and 'isOnline' fields in the user object will not be stored in the relevant channel objects (within allMembers and ownerMembers).
