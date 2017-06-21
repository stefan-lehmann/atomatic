# Atomatic

Atomatic is a flexible and easy to use build and development tool for Atomic Design systems, that enables you and your team to concentrate on 
what really matters, growing and improving your component library. Therefor it takes over the whole process of watching and updating the style 
guide. Due to it's flexibility and it's file based approach it can be integrated in almost any modern development stack with ease. And since 
Atomatic isn't bound to a specific templating language your style guide and production environment can share their source files in order to 
prevent yourself from unnecessary code duplication and circumvention of your style guide.


## Features

- integration with any build tool or task runner such as [webpack](https://webpack.github.io), [gulp](http://gulpjs.com/), [Grunt](https://gruntjs.com/), [brunch](http://brunch.io/), ...
- template engine of your choice ([Pug](https://pugjs.org), [Twig](https://twig.sensiolabs.org/), [Liquid](https://shopify.github.io/liquid/), [Jinja2](http://jinja.pocoo.org/), etc.)
- meaningful and reusable fake data with the help of [JSON Schema Faker](https://www.npmjs.com/package/json-schema-faker)
- build in livereload and synchronized browser testing in development mode based on [Browsersync](https://browsersync.io/)
- css analysis for usage of colors, fonts and media queries
- static style guide version for deployment

## Demo

In order get a better idea of options and capabilities we created a couple of demo projects:

Gulp stack with Pug
Gulp stack with Twig
Gulp stack with liquid
Webpack stack with Twig

## Installation


In order to make integration and updating of Atomatic in your project as easy as possible it is published as single npm module.

```shell
$ npm install atomatic -s
```

## Usage

```javascript
const Atomatic = require('../../atomatic');

new Atomatic(config[, watch[, callback]]);
```



# License

All files are released under the [MIT license](https://raw.githubusercontent.com/stefan-lehmann/atomatic/master/LICENSE.md).

