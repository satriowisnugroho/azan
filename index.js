#!/usr/bin/env node

'use strict';

require('colors');
const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
const assert = require('assert');
const env = require('node-env-file');
const cities = require('./cities');
const fs = require('fs');

let cityList = cities.map(city => {
  return city.id + ' = ' + city.name;
});

let flag = process.argv[2];
if (flag === '--help' || flag === '-h') {
  console.log('Usage: azan [options]\n');
  console.log('Options:\n  --city: City id e.g. `307`\n');
  console.log('Cities:');
  console.log(JSON.stringify(cityList, null, 1));
  process.exit();
} else if (flag && flag.split('=')[0] === '--city') {
  let city = cities.find(city => {
    return city.id === parseInt(flag.split('=')[1]);
  });
  
  if (typeof city === 'undefined') {
    console.log('City not found')
  } else {
    try {
      fs.writeFileSync(__dirname + '/.env', `CITY_ID=${city.id}`, 'utf8');
      console.log(`Configuration Successful\nCity: ${city.id} - ${city.name}`);
    } catch (err) {
      console.log(err);
    }
  }
  process.exit();
}

env(__dirname + '/.env');

let cityId = process.env.CITY_ID;
let city = cities.find(city => {
  return city.id === parseInt(cityId);
});
let url = `http://www.jadwalsholat.org/adzan/ajax/ajax.daily1.php?id=${cityId}`;

request(url, (err, res, body) => {
  if (err) throw err;
  azan.load(body);
});

const azan = {
  load: (body) => {
    let data = azan.getData(cheerio.load(body));
    azan.print(data);
  },
  getData: $ => {
    let data = [], found = null;

    $('tr').each((i, value) => {
      if (i < 2 || i > 6) return;

      let td = $(value).find('td');

      data.push({
        name: td.eq(0).text(),
        time: td.eq(1).text(),
        diff: moment(td.eq(1).text(), 'HH:mm').diff(moment(), 'second'),
      });
    });

    data.some(val => {
      if (val.diff >= 0) {
        found = val;
        return true;
      }
    });

    return {
      azans: data,
      found: found
    };
  },
  print: data => {
    let found = data.found;

    console.log(`\n.:| ${city.name} - ${moment().format('DD MMMM YYYY')} |:.\n`);

    if (found) {
      let time = azan.setTime(found);
      console.log(`Azan ${found.name} at ${found.time} - ${time.yellow} left\n`);
    }

    data.azans.forEach(val => {
      console.log(`${val.name.blue}\t${val.time.green}`);
    });

    console.log('\n');
  },
  setTime: found => {
    let time = '';
    let hour = Math.floor(found.diff / 60 / 60);

    time += hour !== 0 ? `${hour} h ` : '';
    time += Math.floor(found.diff / 60 % 60) + ' m';

    return time;
  }
};
