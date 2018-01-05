const
  path = require('path'),
  sgUtil = require('./util');

class CollectorStore {

  constructor({conf}) {

    this.globOptions = conf.get('globOptions');
    this.htmlExt = conf.get('htmlExt');
    this.dataExt = conf.get('dataExt');
    this.c = conf.get('logLevel', 0);

    this.sections = new Map();
    this.files = new Map();

    this.setSection = this.setSection.bind(this);
    this.setFile = this.setFile.bind(this);
    this.unsetFile = this.unsetFile.bind(this);
    this.updateTimestamp = this.updateTimestamp.bind(this);
    this.setGroupedFile = this.setGroupedFile.bind(this);
    this.unsetGroupedFile = this.unsetGroupedFile.bind(this);
    this.getSection = this.getSection.bind(this);
    this.getFiles = this.getFiles.bind(this);
    this.getSections = this.getSections.bind(this);
    this.getSectionFilesData = this.getSectionFilesData.bind(this);
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
    this.files.set(sgUtil.removeFileExtension(file.filename), file);
    return file;
  }

  getFile(filename) {
    return this.files.get(sgUtil.removeFileExtension(filename));
  }

  unsetFile(filename) {
    this.updateTimestamp(filename);
    this.files.set(sgUtil.removeFileExtension(filename), null);
    console.log(this.files.get(sgUtil.removeFileExtension(filename)))
    this.files.delete(sgUtil.removeFileExtension(filename));
  }

  setGroupedFile(file) {
    const
      {urls, files, constructor} = this,
      {getGroupPaths, getPageTitle} = constructor,
      {filename, url, collector, title, destDir, orderValue} = file,
      {base, groupUrl, name, parentName} = getGroupPaths(filename, url),
      pageTitle = file.pageTitle = getPageTitle(filename, title, name, parentName);

    if (name === 'index' || name === parentName || !urls.get(base)) {
      urls.set(base, {url: groupUrl, title: pageTitle, collector, destDir, orderValue});
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

  getSections() {
    return this.sections;
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
    return [...files.values()].filter(file => destDir === file.destDir);
  }

  getCollectedData() {

    return [...this.getSections().values()].map(section => {

      const needsUpdate = section.getFiles()
        .filter(({exclude}) => exclude)
        .some(({timestamp, _data = {}}) => !section._timestamp || !timestamp || !_data.timestamp || timestamp > section._timestamp || _data.timestamp > section._timestamp);

      if (needsUpdate) {
        section._files = this.getSectionFilesData(section);
        section._timestamp = Date.now();
        sgUtil.log(`Section: \u001b[1m${section.title} (${section._files.length})\u001b[22m collected.`, 'info');
      }

      return {
        files: section._files,
        collector: section.collector,
        route: section.route,
        title: section.title,
        url: section.url
      };
    });
  }

  getSectionFilesData({getFiles}) {

    const {htmlExt, dataExt} = this;

    return getFiles()
      .filter(({exclude}) => exclude)
      .map(({filename, title, componentName, collector, orderValue, url, sectionPath, exclude}) => {

        if (this.logLevel > 2) {
          sgUtil.log(`Get Section Files Data: \u001b[1m${componentName}\u001b[22m added.`);
        }

        return {
          title,
          filename,
          componentName,
          collector,
          url,
          exclude,
          orderValue,
          path: sectionPath,
          dirname: path.dirname(filename),
          asyncContentUrls: {
            source: sgUtil.replaceFileExtension(url, `source.${htmlExt}`),
            locals: sgUtil.replaceFileExtension(url, dataExt),
            schema: sgUtil.replaceFileExtension(url, `schema.${dataExt}`)
          }
        };
      });
  }

  updateTimestamp(filename, newTimestamp = Date.now()) {

    const file = this.getFile(filename);

    if (!file) {
      if (this.logLevel > 2) {
        sgUtil.log(`Update Timestamp: no file object for filename ${filename}`, 'warn');
      }
      return false;
    }

    if (file.timestamp === newTimestamp) {
      if (this.logLevel > 3) {
        sgUtil.log(`Update Timestamp: ${file.componentName} was already updated`, 'notice');
      }

      return false;
    }

    file.timestamp = newTimestamp;

    if (this.logLevel > 3) {
      sgUtil.log(`Update Timestamp: ${file.componentName} updated`, 'info');
    }

    file.parentComponents.map(({filename}) => {
      this.updateTimestamp(filename, newTimestamp);
    });
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