const
  path = require('path'),
  sgUtil = require('./util');

class CollectorStore {

  constructor(settings) {

    this.conf = settings.conf;
    this.TemplateEngine = settings.TemplateEngine;
    this.globOptions = this.conf.get('globOptions');
    this.htmlExt = this.conf.get('htmlExt');
    this.dataExt = this.conf.get('dataExt');

    this.sections = new Map();
    this.files = new Map();

    this.setSection = this.setSection.bind(this);
    this.setFile = this.setFile.bind(this);
    this.unsetFile = this.unsetFile.bind(this);
    this.setGroupedFile = this.setGroupedFile.bind(this);
    this.unsetGroupedFile = this.unsetGroupedFile.bind(this);
    this.getSection = this.getSection.bind(this);
    this.getSections = this.getSections.bind(this);
    this.getUrls = this.getUrls.bind(this);
    this.getCollectedData = this.getCollectedData.bind(this);
  }

  setSection(section) {
    const
      {sections, files, constructor, getFilesOfSection} = this,
      {destDir} = section;

    section.getFiles = getFilesOfSection.bind({destDir, files, constructor});

    sections.set(destDir, section);
  }

  getSection(destDir) {
    const {sections} = this;

    return sections.get(destDir);
  }

  setFile(file) {
    const {filename} = file;

    this.files.set(filename, file);
    return file;
  }

  unsetFile(filename) {
    this.files.delete(filename);
  }

  setGroupedFile(file) {
    const
      {urls, files, constructor} = this,
      {getGroupPaths, getPageTitle} = constructor,
      {filename, url, generator, title, destDir, orderValue} = file,
      {base, groupUrl, name, parentName} = getGroupPaths(filename, url),
      pageTitle = file.pageTitle = getPageTitle(filename, title, name, parentName);

    if (name === 'index' || name === parentName || !urls.get(base)) {
      urls.set(base, {url: groupUrl, title: pageTitle, generator, destDir, orderValue});
    }

    if (files.get(groupUrl) === undefined) {
      files.set(groupUrl, new Map());
    }
    files.get(groupUrl).set(name, file);

    return files.get(groupUrl);
  }

  unsetGroupedFile(filename) {
    const
      {constructor, urls, files} = this,
      {base, name} = constructor.getGroupPaths(filename);

    files.get(filename).delete(name);

    const {size = 0} = files.get(filename);

    if (size === 0) {
      urls.delete(base);
      files.delete(filename);
    }
  }

  getSections(asArray = false) {
    const {sections} = this;

    return asArray === true ? [...sections.values()] : sections;
  }

  getFiles() {
    return this.files;
  }

  getUrls() {
    const urls = new Map();

    this.files.forEach(file => urls.set(sgUtil.removeFileExtension(file.url), file));
    return urls;
  }

  getFilesOfSection() {
    const {files, destDir} = this;
    return [...files.values()]
      .filter(file => destDir === file.destDir);
  }

  getCollectedData() {
    const {getSections} = this;

    return getSections(true).map(section => ({
      generator: section.generator,
      route: section.route,
      title: section.title,
      url: section.url,
      files: section.getFiles().map(file => ({
        title: file.title,
        generator: file.generator,
        orderValue: file.orderValue || path.relative(section.url, path.dirname(file.url)),
        url: file.url,
        path: path.relative(section.url, path.dirname(file.url)),
        asyncContentUrls: {
          source: sgUtil.replaceFileExtension(file.url, `source.${this.htmlExt}`),
          locals: sgUtil.replaceFileExtension(file.url, this.dataExt),
          schema: sgUtil.replaceFileExtension(file.url, `schema.${this.dataExt}`)
        }
      }))
    }));
  }

  static getGroupPaths(filename, url = false) {
    const
      {dir, name} = path.parse(filename),
      parentName = path.basename(dir),
      base = `${dir}/${parentName}`,
      groupUrl = url ? `${url.dirname}/${parentName}${url.extname}` : null;

    return {base, groupUrl, name, parentName};
  }

  static getPageTitle(filename, title, name, parentName) {
    return (name === 'index' || name === parentName) ? title : sgUtil.getTitleFromFoldername(filename);
  }
}

module.exports = CollectorStore;