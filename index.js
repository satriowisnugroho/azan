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
let url = `https://jadwalsholat.org/adzan/monthly.php?id=${cityId}`;

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
    let times = [], found = null;

    $('tr.table_highlight').find('td').each((i, value) => {
      if (i < 1) return;
      let header = $('tr.table_header').find('td').eq(i).text();
      let time = $(value).text();

      times.push({
        name: header,
        time: time,
        diff: i === 1 || i === 3 || i === 4 ? -1 : moment(time, 'HH:mm').diff(moment(), 'second')
      });
    });

    times.some(val => {
      if (val.diff >= 0) {
        found = val;
        return true;
      }
    });

    return {
      times: times,
      found: found
    };
  },
  print: data => {
    let found = data.found;

    console.log(`\n.:| ${city.name} - ${moment().format('DD MMMM YYYY')} |:.\n`);

    if (found) {
      let time = azan.getTime(found);
      console.log(`Azan ${found.name} at ${found.time} - ${time.yellow} left\n`);
    }

    data.times.forEach(val => {
      console.log(`${val.name.blue}\t${val.time.green}`);
    });

    console.log('\n');
  },
  getTime: found => {
    let time = '';
    let hour = Math.floor(found.diff / 60 / 60);

    time += hour !== 0 ? `${hour} h ` : '';
    time += Math.floor(found.diff / 60 % 60) + ' m';

    return time;
  }
};
