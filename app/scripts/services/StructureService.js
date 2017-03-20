class StructureService {

  constructor(data) {
    this.data = data;
    this.urls = {};

    this.flattenUrls(data);
  }


  flattenUrls(sections) {

    [...sections].map((section) => {

      const {url = null, urls = []} = section;

      if (typeof url === 'string') {
        this.urls[url] = section;
      }
      if (urls.length > 0) {
        this.flattenUrls(urls);
      }
    });
  }
}

export default StructureService;