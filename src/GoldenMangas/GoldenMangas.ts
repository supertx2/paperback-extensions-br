import {
  Source,
  Manga,
  MangaStatus,
  Chapter,
  ChapterDetails,
  HomeSection,
  MangaTile,
  SearchRequest,
  LanguageCode,
  TagSection,
  PagedResults,
  SourceInfo,
  Tag
} from "paperback-extensions-common"

const GOLDENMANGAS_DOMAIN = 'https://goldenmanga.top'

export const GoldenMangasInfo: SourceInfo = {
  version: '0.4.1',
  name: 'Golden Mangás',
  description: 'Extension that pulls manga from goldenmanga.top',
  author: 'Conrad Weiser',
  authorWebsite: 'https://github.com/supertx2',
  icon: "logo.jpg",
  hentaiSource: false,
  websiteBaseURL: GOLDENMANGAS_DOMAIN,
}

export class GoldenMangas extends Source {
  getMangaShareUrl(mangaId: string): string | null { return `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}` }

  async getMangaDetails(mangaId: string): Promise<Manga> {

    let request = createRequestObject({
      url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}`,
      method: 'GET'
    })

    const data = await this.requestManager.schedule(request, 1)

    let manga: Manga[] = []
    let $ = this.cheerio.load(data.data)

    const infoElement = $("div.row > div.col-sm-8 > div.row").first()
    const firstColumn = $("div.col-sm-4.text-right > img").first()
    const secondColumn = $("div.col-sm-8").first()


    const titles = [secondColumn.find("h2").eq(0).text().trim()];
    const image = firstColumn.attr('src')
    const status = secondColumn.find("h5:contains(Status) a").text() == "Completo" ? MangaStatus.COMPLETED : MangaStatus.ONGOING;
    const author = secondColumn.find("h5:contains(Autor)")!!.text();
    const artist = secondColumn.find("h5:contains(Artista)")!!.text();
    const rating = Number(secondColumn.find("h2").eq(1).text().replace('#','').split(' ')[0]);

    const genres :Tag[] = []; 
    secondColumn.find("h5:contains(Genero) a").filter((i,e) =>!!$(e).text()).toArray().map(e => genres.push({
      id: $(e).text().trim()
      , label: $(e).text().trim()      
    }));
    
    let tags: TagSection[] = [createTagSection({ id: 'genres', label: 'genres', tags: genres })]
  
    let summary = $("#manga_capitulo_descricao").text().trim()

    return createManga({
      id: mangaId,
      rating: rating,
      titles: titles,
      image: `${GOLDENMANGAS_DOMAIN}${image!}`,
      author: author,
      artist: artist,
      status: Number(status),
      tags: tags,
      desc: summary
    })
  }


  async getChapters(mangaId: string): Promise<Chapter[]> {

    let request = createRequestObject({
      url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}`,
      method: "GET"
    })

    const data = await this.requestManager.schedule(request, 1)

    let $ = this.cheerio.load(data.data)
    let chapters: Chapter[] = []

    for (let obj of $("ul#capitulos li.row").toArray()) {
      const $obj = $(obj);
      const firstColumn = $obj.find("a > div.col-sm-5")
      const secondColumn = $obj.find("div.col-sm-5.text-right a[href^='http']")

      const rawName = firstColumn.text()
      const name = rawName.substring(0,rawName.indexOf('(')).trim();
      const splitedDate = firstColumn.find("span[style]").text().replace('(','').replace(')','').trim().split('/').map(i=> Number(i));

      let time = new Date(splitedDate[2],splitedDate[1], splitedDate[0]);

      let id = $('a', $(obj)).attr('href')?.replace(`/mangabr/${mangaId}/`, '')
      let chapNum = Number(id)

      // If we parsed a bad ID out, don't include this in our list
      if (!id) {
        continue
      }

      chapters.push(createChapter({
        id: id,
        mangaId: mangaId,
        chapNum: chapNum,
        langCode: LanguageCode.BRAZILIAN,
        name: name,
        time: time
      }))
    }

    return chapters
  }


  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

    let request = createRequestObject({
      url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}/${chapterId}`,
      method: 'GET',
    })

    const data = await this.requestManager.schedule(request, 1)

    let $ = this.cheerio.load(data.data)
    let pages: string[] = []

    // Get all of the pages
    let pagesImgs = $("div.col-sm-12[id^='capitulos_images']:has(img[pag])").first().find("img")

    for (let img of pagesImgs.toArray()) {
      const $img = $(img);
      pages.push(`${GOLDENMANGAS_DOMAIN}${$img.attr("src")}`)
    }

    return createChapterDetails({
      id: chapterId,
      mangaId: mangaId,
      pages: pages,
      longStrip: false
    })
  }

  async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {

    let request = createRequestObject({
      url: `${GOLDENMANGAS_DOMAIN}/mangabr?busca=${query.title}`,
      method: "GET"
    })

    const data = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(data.data)

    let mangaTiles: MangaTile[] = []

    // Parse the json context
    for (let manga of $("div.mangas.col-lg-2 a").toArray()) {
      const $manga = $(manga);
      
      const title = $manga.find("h3").text();
      const id = $manga.attr("href")?.replace("/mangabr/", "");
      const image = $manga.find("img").attr("href")
      mangaTiles.push(createMangaTile({
        id: id!,
        title: createIconText({ text: title }),
        image: `${GOLDENMANGAS_DOMAIN}${image!}`
      }))
      
    }

    // Because we're reading JSON, there will never be another page to search through
    return createPagedResults({
      results: mangaTiles
    })

  }


  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

    // Let the app know what the homsections are without filling in the data
    let mostReadMangas = createHomeSection({ id: 'mostReadMangas', title: 'Mangás mais lidos' })
    sectionCallback(mostReadMangas)

    // Make the request and fill out available titles
    let request = createRequestObject({
      url: `${GOLDENMANGAS_DOMAIN}`,
      method: 'GET'
    })

    const data = await this.requestManager.schedule(request, 1)

    let popularMangas: MangaTile[] = []
    let $ = this.cheerio.load(data.data)

    let context = $("div#maisLidos div.itemmanga");
    for (let obj of context.toArray()) {
      const $obj = $(obj);
      let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
      let id = $obj.attr('href')?.replace('/mangabr/','');
      let title = $obj.find("h3").text().trim();

      // If there was not a valid ID parsed, skip this entry
      if (!id) {
        continue
      }

      // Ensure that this title doesn't exist in the tile list already, as it causes weird glitches if so.
      // This unfortunately makes this method O(n^2) but there never will be many elements
      let foundItem = false
      for (let item of popularMangas) {
        if (item.id == id) {
          foundItem = true
          break
        }
      }

      if (foundItem) {
        continue
      }

      popularMangas.push(createMangaTile({
        id: id,
        title: createIconText({ text: title }),
        image: img
      }))
    }

    mostReadMangas.items = popularMangas

    sectionCallback(mostReadMangas)
  }
}