const jsf = require('json-schema-faker');

function imageUrl() {
  return (width = 800, height = 600, image) => {
    if (image === undefined) {
      const min = 1, max = 100;
      image = Math.round(Math.random() * (max - min) + min);
    }
    return `//unsplash.it/${width}/${height}/?image=${image}`;
  }
}

function include() {
  return (includePath) => `include ${includePath}`;
}

jsf.extend('faker', (faker) => {

  faker.include = include(faker);
  faker.imageUrl = imageUrl(faker);

  return faker;
});


module.exports = jsf;