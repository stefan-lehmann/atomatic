const
  path = require('path'),
  sgUtil = require('./util');

class CollectorStore {

  constructor(settings) {

    this.conf = settings.conf;
    this.TemplateEngine = settings.TemplateEngine;

    this.sections = new Map();
    this.files = new Map();
    this.urls = new Map();

    this.setSection = this.setSection.bind(this);
    this.setFile = this.setFile.bind(this);
    this.unsetFile = this.unsetFile.bind(this);
    this.setGroupedFile = this.setGroupedFile.bind(this);
    this.unsetGroupedFile = this.unsetGroupedFile.bind(this);
    this.getSection = this.getSection.bind(this);
    this.getSections = this.getSections.bind(this);
    this.getFiles = this.getFiles.bind(this);
    this.getUrls = this.getUrls.bind(this);
    this.getCollectedData = this.getCollectedData.bind(this);
  }

  setSection(section) {
    const
      {sections, urls, constructor, getUrlsOfSection} = this,
      {destDir} = section;

    section.getUrls = getUrlsOfSection.bind({destDir, urls, constructor});

    sections.set(destDir, section);
  }

  getSection(destDir) {
    const {sections} = this;

    return sections.get(destDir);
  }

  setFile(file) {
    const
      {filename, url, parentUrl = '', generator, title, destDir, orderValue} = file,
      base = sgUtil.removeFileExtension(filename);

    this.urls.set(base, {url, parentUrl, generator, title, destDir, orderValue});
    this.files.set(url, file);
    return file;
  }

  unsetFile(filename) {
    const
      base = sgUtil.removeFileExtension(filename),
      {url} = this.urls.get(base);

    this.urls.delete(base);
    this.files.delete(url);
  }

  setGroupedFile(file) {
    const
      {urls, files, constructor} = this,
      {getGroupPaths, getPageTitle} = constructor,
      {filename, url, parentUrl = '', generator, title, destDir, orderValue} = file,
      {base, groupUrl, name, parentName} = getGroupPaths(filename, url),
      pageTitle = file.pageTitle = getPageTitle(filename, title, name, parentName);

    if (name === 'index' || name === parentName || !urls.get(base)) {
      urls.set(base, {url: groupUrl, title: pageTitle, generator, parentUrl, destDir, orderValue});
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
      {base, name} = constructor.getGroupPaths(filename),
      {url} = urls.get(base);

    files.get(url).delete(name);

    const {size = 0} = files.get(url);

    if (size === 0) {
      urls.delete(base);
      files.delete(url);
    }
  }

  getSections(asArray = false) {
    const {sections} = this;

    return asArray === true ? [...sections.values()] : sections;
  }

  getFiles(asArray = false) {
    const {files} = this;

    return asArray === true ? [...files.values()] : files;
  }

  getUrls(asArray = false) {
    const {urls} = this;

    return asArray === true ? [...urls.values()] : urls;
  }

  getUrlsOfSection() {
    const {constructor} = this;

    let urls = [];

    [...this.urls.values()]
      .sort(constructor.sortByOrderValue)
      .map((urlItem) => {
        const {parentUrl, destDir} = urlItem;

        if (destDir === this.destDir) {
          if (parentUrl === '') {
            urls.push(Object.assign(urlItem, {urls: []}));
          }
          else {
            const parentUrlItem = urls.find((assignedItem) => assignedItem.url === parentUrl);
            parentUrlItem.urls.push(urlItem);
          }
        }
      });
    return urls;
  }

  getCollectedData() {
    const {getSections, constructor} = this;

    return getSections(true).map((section) => {
      const data = constructor.simplifyData(section);
      data.urls = constructor.simplifyData(section.getUrls());
      delete data.dataLoader;
      return data;
    });
  }

  static sortByOrderValue(a, b) {
    const
      valueA = a.orderValue ? a.orderValue.toLowerCase() : '',
      valueB = b.orderValue ? b.orderValue.toLowerCase() : '';

    return valueA == valueB ? 0 : valueA < valueB ? -1 : 1;
  }

  static simplifyData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }


  static getGroupPaths(filename, url = false) {
    const
      {dir, name}  = path.parse(filename),
      parentName = path.basename(dir),
      base = `${dir}/${parentName}`,
      groupUrl = url ? `${path.dirname(url)}/${parentName}${path.extname(url)}` : null;

    return {base, groupUrl, name, parentName};
  }

  static getPageTitle(filename, title, name, parentName) {
    return (name === 'index' || name === parentName) ? title : sgUtil.getTitleFromFoldername(filename);
  }
}

module.exports = CollectorStore;