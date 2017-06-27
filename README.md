# Atomatic

Atomatic is a flexible and easy to use build and development tool for Atomic Design systems. It enables you and your team to concentrate on what really matters, growing and improving your component library. Therefore it takes over the whole process of watching and updating the style guide. Due to it's flexibility and it's file based approach it can be integrated in almost any modern development stack with ease. And since Atomatic isn't bound to a specific templating language your style guide and production environment can share their source files in order to prevent yourself from unnecessary code duplication and circumvention of your style guide.


## Features

- integration with any build tool or task runner such as [webpack](https://webpack.github.io), [gulp](http://gulpjs.com/), [Grunt](https://gruntjs.com/), [brunch](http://brunch.io/), ...
- template engine of your choice ([Pug](https://pugjs.org), [Twig](https://twig.sensiolabs.org/), [Liquid](https://shopify.github.io/liquid/), [Jinja2](http://jinja.pocoo.org/), etc.)
- meaningful and reusable fake data with the help of [JSON Schema Faker](https://www.npmjs.com/package/json-schema-faker)
- build in livereload and synchronized browser testing in development mode based on [Browsersync](https://browsersync.io/)
- css analysis for usage of colors, fonts and media queries
- static style guide version for deployment

## Requirements

Atomatic is written in Node.js and requires Version: 7+. So far it has been tested in Mac and Linux only.


## Demo

In case you don't have time to read the documentation first and for better idea of options and capabilities in general we created a couple of demo projects:

Gulp stack with Pug _(comming soon)_   
Gulp stack with Twig _(comming soon)_  
Gulp stack with Liquid _(comming soon)_   
Webpack stack with Twig _(comming soon)_  


## Installation

In order to make integration and updating of Atomatic in your project as easy as possible it is published as single npm module.

```shell
$ npm install atomatic -s
```

## Usage

Atomatic is shipped with a [default configuration](https://github.com/stefan-lehmann/atomatic/blob/master/config/default.json), that can be overridden easily in order to adapt the setup to the requirements of your project. Adaption just need to be passed in on instantiation of Atomatic.

```javascript

const config = {
  /* CONFIGURATION OBJECT THAT OVERRIDES DEFAULT CONFIG */
};

const Atomatic = require('atomatic');     


new Atomatic(config[, watch[, callback]]);
```
### Options

- **baseDir (default: 'source/styleguide')**  
_relative path to the root folder of the style guide sources_  
- **dest (default: 'public')**    
_relative path to the target folder for generated files_
- **templateExt (default: 'pug')**    
_file extension of template files_
- **htmlExt (default: 'html')**    
_file extension of generated html files_
- **markdownExt (default: 'md')**    
_file extension of markdown files (for documentation purposes)_
- **dataExt (default: 'json5')**     
_file extension of data files_
- **defaultDataFileName (default: 'data')**    
_name of the default data files, which act as fallback in case there is no specific data file that matches the name of the template file_
- **sections (default: see [Sections config](#sections-config))**  
_enables the different Atomatic collectors with a distinct configuration for each of them_
- **app (type: Object)**  
_configuration of the viewer app_
- **server (type: Object)**  
_configuration local web server that serves the viewer in development mode_
- **dumpData (default: false)**   
_tells Atomatic to dump generated data to the file system in order to simplify debugging_
- **logLevel (default: 2)**     
_sets the level of verbosity_

# License

All files are released under the [MIT license](https://raw.githubusercontent.com/stefan-lehmann/atomatic/master/LICENSE.md).

