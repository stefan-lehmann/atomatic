const
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
    this.getSection = this.getSection.bind(this);
    this.getSections = this.getSections.bind(this);
    this.getFiles = this.getFiles.bind(this);
    this.getUrls = this.getUrls.bind(this);
    this.getFileData = this.getFileData.bind(this);
    this.simplifyData = this.simplifyData.bind(this);
    this.getCollectedData = this.getCollectedData.bind(this);
  }

  setSection(section) {
    const {sections, urls, getUrlsOfSection} = this;

    section.getUrls = getUrlsOfSection.bind({
      destDir: section.destDir,
      urls: urls
    });

    sections.set(section.destDir, section);
  }

  getSection(destDir) {
    const {sections} = this;
    return sections.get(destDir);
  }

  setFile(file) {
    const
      {filename, url, title, isIndexFile, destDir, orderValue} = file,
      base = sgUtil.removeFileExtension(filename);

    this.urls.set(base, {url, title, isIndexFile, destDir, orderValue});
    this.files.set(url, file);
    return file;
  }

  unsetFile(filename) {
    const
      base = sgUtil.removeFileExtension(filename),
      url = this.urls.get(base);

    this.urls.delete(base);
    this.files.delete(url);
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

  getFileData(file) {
    const data = file.getData();
    file.title = data.title || 'No Name';
  }

  getFilesOfSection() {
    const files = [];

    this.files.forEach((file) => {
      if (!file.isIndexFile && file.destDir === this.destDir) {
        files.push(file);
      }
    });

    return urls.sort(this.sortByOrderValue);
  }

  getUrlsOfSection() {
    const urls = [];

    this.urls.forEach((url) => {
      if (!url.isIndexFile && url.destDir === this.destDir) {
        urls.push(url);
      }
    });
    return urls.sort(this.sortByOrderValue);
  }

  sortByOrderValue(a, b) {
    const
      valueA = a.orderValue ? a.orderValue.toLowerCase() : '',
      valueB = b.orderValue ? b.orderValue.toLowerCase() : '';
    return valueA == valueB ? 0 : valueA < valueB ? -1 : 1;
  }

  getCollectedData() {
    return this.getSections(true).map((section) => {
      const data = this.simplifyData(section);
      data.urls = this.simplifyData(section.getUrls());
      return data;
    });
  }

  simplifyData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}

module.exports = CollectorStore;