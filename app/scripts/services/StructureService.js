import Vue from 'vue';

class StructureService {

  constructor(sections, maxLevel = 2) {
    this.maxLevel = maxLevel;
    this.sections = sections;
    this.urls = sections.reduce(this.generateSectionStructure.bind(this), {});
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
      valueB = b.orderValue ? b.orderValue.toLowerCase() : '',
      titleA = a.title ? a.title.toLowerCase() : '',
      titleB = b.title ? b.title.toLowerCase() : '';

    return valueA === valueB ? titleA < titleB ? -1 : 1 : valueA < valueB ? -1 : 1;
  }

  static capitalizeString(str) {
    return str.toLowerCase()
      .replace(/\b\w/g, (matches) => matches.toUpperCase());
  }

  static getTitleFromName(str) {
    return self.capitalizeString(str)
      .replace(/\d{2,}-|\-|_/g, ' ')
      .trim();
  }

  generateSectionStructure(urls, section) {
    const
      {maxLevel} = this,
      {files = [], url: basePath} = section;

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
              url = [basePath, itemPath].filter(item => item)
                .join('/'),
              redundantIndex = currentUrls.findIndex((item) => item.url === url);

            if (!lastIndex && redundantIndex > -1) {
              return current.urls[redundantIndex];
            }

            const item = getItemFunction({name, url, file, current});

            urls[item.baseUrl] = Object.assign({}, item);

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
                item.grouped = [Vue.util.extend({}, item)];
                item.title = self.getTitleFromName(item.name);
                item.orderValue = item.name;
              }
              else {
                item.grouped.push(Vue.util.extend({}, item));
                item.grouped.sort(self.sortByOrderValue);
              }
            }

            return item;
          }, section);
      });

    return urls;
  }

  getVirtualItem(options) {
    const
      {name, url, file} = options,
      {path, ext, collector, componentName} = file;

    return {
      name,
      url,
      collector,
      filename: `index.${ext}`,
      title: self.getTitleFromName(name),
      orderValue: path
    };
  }

  getRealItem(options) {
    const
      {name, url, file, current} = options,
      {url: fileUrl, title, path, orderValue, collector, asyncContentUrls, componentName} = file,
      {title: pageTitle} = current;

    return {
      name,
      componentName,
      url,
      fileUrl,
      asyncContentUrls,
      collector,
      title,
      pageTitle,
      orderValue: orderValue || path,
      baseUrl: fileUrl.split('.').slice(0, -1).join('.')
    };
  }

  static filteredStructure(structure, search='atoms') {
    if (search.length < 3){
      return null;
    }

    return Object.values(structure).reduce((carray, item) => {
      return StructureService.filter(carray, search, item);
    }, []);
  }

  static filter(carry, search, file) {
    if (file.urls) {
      file.urls.forEach((item) => StructureService.filter(carry, search, item));
      return carry;
    }

    if (file.grouped) {
      file.grouped.forEach((item) => StructureService.filter(carry, search, item));
      return carry;
    }

    if (file.componentName && file.componentName.indexOf(search) !== -1) {
      carry.push(Object.assign({}, file, {title: file.componentName}));
    }
    return carry;
  }
}

const self = StructureService;

export default StructureService;
