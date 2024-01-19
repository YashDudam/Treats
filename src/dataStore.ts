// YOU SHOULD MODIFY THIS OBJECT BELOW
import { Data } from './types';
import fs from 'fs';
const data: Data = {
  userData: [],
  channelData: [],
  userTokens: [],
  dmData: []
};
// Use get() to access the data
const getData = (): Data => JSON.parse(String(fs.readFileSync('dataStore.json', { flag: 'r' })));

// Use set(newData) to pass in the entire data object, with modifications made
const setData = (newData: Data) => {
  fs.writeFileSync('dataStore.json', JSON.stringify(newData), { flag: 'w' });
};

setData(data);

export { getData, setData };

/*
// YOU SHOULD MODIFY THIS OBJECT BELOW
import { Data } from './types';
let data: Data = {
>>>>>>> 6cbc43c (12.07 failing tests because of memory data not working)
  userData: [],
  channelData: [],
  userTokens: [],
  dmData: []
};

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

Example usage
  let store = getData()
  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

  names = store.names

  names.pop()
  names.push('Jake')

  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
  setData(store)

// Use get() to access the data
const getData = (): Data => JSON.parse(String(fs.readFileSync('dataStore.json', { flag: 'r' })));

// Use set(newData) to pass in the entire data object, with modifications made
const setData = (newData: Data) => {
  fs.writeFileSync('dataStore.json', JSON.stringify(newData), { flag: 'w' });
};

setData(data);

export { getData, setData };

*/
