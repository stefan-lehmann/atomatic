class StructureService {

  constructor(data) {
    this.data = data;
    this.maxLevel = 2;
    this.urls = {};
    this.structure = {};

    this.data.map(this.generateSectionStructure.bind(this));
  }

  generateSectionStructure(section) {
    const
      {urls, maxLevel} = this,
      {files, url: basePath} = section;

    files
      .sort(self.sortByOrderValue)
      .map((file, index) => {
      const
        splittedPath = file.path.split('/'),
        hasSiblings = self.hasSiblings(file, index, files);

      splittedPath
        .slice(0, maxLevel)
        .reduce((current, name, index, array) => {
          const
            {urls: currentUrls = []} = current,
            index1 = index + 1,
            lastIndex = index1 === array.length,
            getItemFunction = lastIndex ? this.getRealItem : this.getVirtualItem,
            pathFragments = index1 === maxLevel ? splittedPath : splittedPath.slice(0, index1),
            itemPath = pathFragments.join('/'),
            url = [basePath, itemPath].filter(item => item).join('/'),
            redundantIndex = currentUrls.findIndex((item) => item.url === url);

          if (!lastIndex && redundantIndex > -1) {
            return current.urls[redundantIndex];
          }

          const item = getItemFunction(name, url, file, current);

          if (lastIndex && hasSiblings && redundantIndex > -1) {
            current = current.urls[redundantIndex];
            current.grouped.push(item);
            current.grouped.sort(self.sortByOrderValue);
            return item;
          }
          else {
            urls[url] = item;
          }

          if (current.urls === undefined) {
            current.urls = [];
          }

          current.urls.push(item);
          current.urls.sort(self.sortByOrderValue);

          if (lastIndex && hasSiblings) {
            if (item.grouped === undefined) {
              item.grouped = [];
            }
            item.grouped.push(item);
            item.grouped.sort(self.sortByOrderValue);
          }

          return item;

        }, section);
    });
  }

  getVirtualItem(name, url, file) {
    const {path, ext, generator} = file;
    return {
      name,
      url,
      generator,
      filename: `index.${ext}`,
      title: self.getTitleFromName(name),
      orderValue: path
    }
  }

  getRealItem(name, url, file, current) {
    const {path, url:realUrl, title, filename, orderValue, generator} = file;
    const {title: pageTitle} = current;
    return {
      name,
      url,
      realUrl,
      generator,
      filename,
      title,
      pageTitle,
      orderValue: orderValue || path
    }
  }

  static hasSiblings(file, index, files) {
    const siblings = files
      .filter((otherFile, otherIndex) => index !== otherIndex)
      .filter((otherFile) => otherFile.path === file.path);

    return siblings.length > 0;
  }

  static sortByOrderValue(a, b) {
    const
      valueA = a.orderValue ? a.orderValue.toLowerCase() : '',
      valueB = b.orderValue ? b.orderValue.toLowerCase() : '';

    return valueA === valueB ? 0 : valueA < valueB ? -1 : 1;
  }

  static capitalizeString(str) {
    return str.toLowerCase().replace(/\b\w/g, (matches) => matches.toUpperCase());
  }

  static getTitleFromName(str) {
    return self.capitalizeString(str).replace(/\d{2,}-|\-|_/g, ' ').trim();
  }
}

const self = StructureService;

export default StructureService;