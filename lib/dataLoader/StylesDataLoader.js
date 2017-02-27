const
  path = require('path'),
  extend = require('extend'),
  sgUtil = require('../util'),
  CssAnalyzer = require('../analyser/CssAnalyzer'),
  VariableAnalyser = require('../analyser/VariableAnalyser');

class StylesDataLoader {

  constructor(conf) {

    this.conf = conf;

    this.cssSource = this.conf.get('cssSource');
    this.viewerDest = `${this.conf.get('viewerDest')}/css`;
    this.viewerRootPath = this.conf.get('app.viewerRootPath');
    this.dest = this.conf.get('dest');
    this.globOptions = this.conf.get('globOptions');
    this.cssVarSource = this.conf.get('cssPreprocessorVars.filename', null);
    this.cssVarDelimiter = this.conf.get('cssPreprocessorVars.delimiter', null);
    this.generatedViewerCssFile = this.conf.get('generatedViewerCssFile', 'generated.css');
    this.generatedViewerCss = [];
    this.properties = {};

    this.CssAnalyzer = new CssAnalyzer(this.cssSource, this.globOptions);
    this.VariableAnalyser = new VariableAnalyser(this.cssVarSource, this.globOptions, this.cssVarDelimiter);
  }

  aggregateData() {

    this.css = this.CssAnalyzer.getAnalysis();
    this.vars = this.VariableAnalyser.getAnalysis();

    let update = false;

    if (this.CssAnalyzer.getVersion() !== this.cssAnalyzerVersion) {
      this.cssAnalyzerVersion = this.CssAnalyzer.getVersion();
      update = true;
    }

    if (this.VariableAnalyser.getVersion() !== this.variableAnalyzerVersion) {
      this.variableAnalyzerVersion = this.VariableAnalyser.getVersion();
      update = true;
    }

    if (update === true) {
      this.getColors();
      this.backgroundImages();
      this.getWebFonts();
      this.getMediaQueries();
      this.writeGenerated();
    }
  }

  getData(filename) {
    const data = sgUtil.readRelatedData(filename);

    this.aggregateData();

    extend(true, data, {
      app: {
        cssFiles: [`/${this.viewerRootPath}/css/app.css`, `/${this.viewerRootPath}/css/${this.generatedViewerCssFile}`]
      },
      locals: {
        title: data.title,
        properties: this.properties || []
      }
    });

    return data;
  }

  writeGenerated() {
    const {viewerDest, generatedViewerCssFile, generatedViewerCss} = this;
    sgUtil.writeFile(path.join(viewerDest, generatedViewerCssFile), generatedViewerCss.join('\n'));
  }

  getColors() {
    let colors;
    colors = this.css.declarations.getUniqueValues(this.CssAnalyzer.getColorProperties());
    colors = VariableAnalyser.getRelatedVars(this.vars, colors);
    colors = this.processValues(colors, 'background-color');
    this.properties.colors = colors;
  }

  getWebFonts() {
    let fonts;
    fonts = this.css.fontFaces.values;
    fonts = this.processFontValues(fonts);
    this.properties.fonts = fonts;
  }

  backgroundImages() {
    let backgroundImages;
    backgroundImages = this.css.declarations.getUniqueValues('background-image');
    backgroundImages = this.processValues(backgroundImages, 'background-image');
    this.properties.backgroundImages = backgroundImages;
  }

  getMediaQueries() {
    let mediaQueries;
    mediaQueries = this.css.mediaQueries.getUniqueMediaQueries();
    mediaQueries = VariableAnalyser.getRelatedVars(this.vars, mediaQueries);
    mediaQueries = this.processMediaQueries(mediaQueries);
    this.properties.mediaQueries = mediaQueries;
  }

  generateClassName(value, type) {
    return `dsc-${type}--${sgUtil.hashCode(value)}`;
  }

  processMediaQueries(properties) {
    const {generateClassName, generatedViewerCss} = this;
    properties.map((property) => {

      let value = property.value = `@media ${property.value}`;

      const
        viewerClassName = property.viewerClassName = generateClassName(value, 'media-query');

      generatedViewerCss.push(`
                              .${viewerClassName}:after { content: attr(data-inactive) }
                              ${value} { 
                                .${viewerClassName} { opacity: 1 } 
                                .${viewerClassName}:after { content: attr(data-active) }
                              }`);

    });
    return properties;
  }

  processValues(properties, type) {
    const {generateClassName, generatedViewerCss} = this;

    properties.map((property) => {
      const
        {value} = property,
        viewerClassName = property.viewerClassName = generateClassName(value, type);

      generatedViewerCss.push(`.${viewerClassName} { ${type}: ${value} }`);

    });
    return properties;
  }

  processFontValues(fontFaces) {
    const {generateClassName, generatedViewerCss} = this;

    fontFaces.map((fontFace) => {
      const
        viewerClassName = generateClassName(JSON.stringify(fontFace), 'font-face'),
        declarations = Object.keys(fontFace)
          .map((property) => `${property}: ${fontFace[property]}`)
          .join(';');

      generatedViewerCss.push(`.${viewerClassName} { ${declarations} }`);
      fontFace.viewerClassName = viewerClassName;
    });
    return fontFaces;
  }
}

module.exports = StylesDataLoader;