#!/usr/bin/env node

'use strict';

const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
require('colors');

let cityId = 307;
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

    console.log(`\n.:| JADWAL SHOLAT HARI INI ${moment().format('DD MMMM YYYY')} |:.\n`.red);

    if (found) {
      let time = azan.setTime(found);
      console.log(`Azan sholat ${found.name} pukul ${found.time} tinggal ${time.yellow} lagi\n`);
    }

    data.azans.forEach(val => {
      console.log(`${val.name.blue}\t${val.time.green}`);
    });

    console.log('\n');
  },
  setTime: found => {
    let time = '';
    let hour = Math.floor(found.diff / 60 / 60);

    time += hour !== 0 ? `${hour} jam ` : '';
    time += Math.floor(found.diff / 60 % 60) + ' menit';

    return time;
  }
};
