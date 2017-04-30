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

function linkUrl() {
  return () => {
    return `#`;
  }
}

function use() {
  return (data, index) => {
    if (Array.isArray(data) && Array.isArray(index)) {
      const
        currentIndex = index.length - 1,
        totalSize = data.length;

      index.push(currentIndex);
      return data[currentIndex % totalSize];
    }
    return data;
  }
}

jsf.extend('faker', (faker) => {
  faker.use = use();
  faker.imageUrl = imageUrl();
  faker.linkUrl = linkUrl();

  return faker;
});

module.exports = jsf;