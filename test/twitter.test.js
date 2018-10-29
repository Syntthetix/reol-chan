'use strict';

var twitter = require('../lib/modules/twitter.js');

describe("Twitter", function() {
  let options = {
    url: 'https://twitter.com/causztic',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'
    }
  };
  test('it should scrape a post properly', () => {
    return twitter.getTwitterList(options).then(data => {
      expect(data).toBeDefined();
      data.each((_, datum) => {
        expect(typeof datum.text).toBe('string');
        if (datum.image) {
          expect(datum.images).toContain(datum.image);
        } else {
          expect(datum.images.length).toBe(0);
        }
        expect(datum.url).toBeTruthy();
      });
    });
  });

  test.skip('it should write to db and upload to file storage if it does not exist', () => {});
  test.skip('it should not write to the database if it exists', () => {});
  test.skip('it should save videos properly', () => {});
});