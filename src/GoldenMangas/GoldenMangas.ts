import {
	Source,
	Manga,
	MangaStatus,
	Chapter,
	ChapterDetails,
	HomeSection,
	MangaTile,
	ContentRating,
	SearchRequest,
	LanguageCode,
	TagSection,
	PagedResults,
	SourceInfo,
	Tag, TagType
} from "paperback-extensions-common"

const GOLDENMANGAS_DOMAIN = 'https://goldenmanga.top/'
const method = 'GET'
export const GoldenMangasInfo: SourceInfo = {
	version: '0.2',
	name: 'Golden Mangás',
	description: 'Extension that pulls manga from goldenmanga.top',
	author: 'SuperTx2',
	authorWebsite: 'https://github.com/supertx2',
	icon: "icon.jpg",
	contentRating: ContentRating.ADULT,
	websiteBaseURL: GOLDENMANGAS_DOMAIN,
	sourceTags: [
        {
            text: 'New',
            type: TagType.GREEN,
        },
	 	{
            text: 'Beta',
            type: TagType.RED
        },
        {
            text: 'PT-BR',
            type: TagType.GREY,
        },
    ],
}

export class GoldenMangas extends Source {
	readonly headers = {
		"referer" :`https://google.com/`,
		"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36",
		"accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6,gl;q=0.5",
		"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
		'content-type':'text/html; charset=UTF-8'
	};
	readonly requestManager = createRequestManager({
		requestsPerSecond: 3,
		requestTimeout: 100000,
		interceptor: {
			interceptRequest: async (request) => request,
			interceptResponse :  async function name(response){
				console.log("interceptResponse");
				response["fixedData"] = response.data || Buffer.from(createByteArray(response.rawData)).toString()
				return response;
			}
		}
	});
	getCloudflareBypassRequest() {
		return createRequestObject({
			url: GOLDENMANGAS_DOMAIN,
			method: "GET",
		})
	}

	// getMangaShareUrl(mangaId: string): string | null { return `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}` }

	async getMangaDetails(mangaId: string): Promise<Manga> {

		let request = createRequestObject({
			url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}`,
			method: 'GET',
			headers: this.headers
		})

		const response = await this.requestManager.schedule(request, 1)
		let $ = this.cheerio.load(response.data || response['fixedData'])

		let manga: Manga[] = []
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

		let tags: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: genres })]

		let summary = $("#manga_capitulo_descricao").text().trim()

		return createManga({
			id: mangaId,
			rating: rating,
			titles: titles,
			image: `${GOLDENMANGAS_DOMAIN}${image!}`,
			author: author,
			artist: artist,
			status: Number(status),
			// tags: tags, //It's making the app to crash
			desc: summary
		})
	}


	async getChapters(mangaId: string): Promise<Chapter[]> {

		let request = createRequestObject({
			url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}`,
			method: "GET"
		})

		const response = await this.requestManager.schedule(request, 1)

		let $ = this.cheerio.load(response.data || response['fixedData'])
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
			headers: this.headers
		})

		const response = await this.requestManager.schedule(request, 1)

		let $ = this.cheerio.load(response.data || response['fixedData'])
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

	async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
		const page = metadata?.page ?? 1
		let search = !!query.title ? `busca=${query.title}` : '';
		
		//We can only search by title or by tags
		if(!search) {
			search = ((query.includedTags?.length ?? 0) > 0) ? `genero=${query.includedTags?.map(t=>t.id)!.join(',')}` : '';
		}
		
		const request = createRequestObject({
			url: `${GOLDENMANGAS_DOMAIN}/mangabr?${search}&pagina=${page}`,
			method: "GET",
			headers: this.headers
		})

		const response = await this.requestManager.schedule(request, 1)
		const $ = this.cheerio.load(response.data || response['fixedData'])

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
		
		const pages = $(".pagination li");
		const totalPages = Number(pages.eq(pages.length-2).text().trim() || 1);
		
		// Because we're reading JSON, there will never be another page to search through
		return createPagedResults({
			results: mangaTiles,
			metadata: {
				page: page,
				totalPages: totalPages
			}
		})

	}

	override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
		// Let the app know what the homsections are without filling in the data
		let mostReadMangas = createHomeSection({ id: 'mostReadMangas', title: 'Mangás mais lidos' })
		sectionCallback(mostReadMangas)
		let latestUpdates = createHomeSection({ id: 'latestUpdates', title: 'Últimas Atualizações' })
		sectionCallback(latestUpdates)
		let newReleases = createHomeSection({ id: 'newReleases', title: 'Novos mangás' })
		sectionCallback(newReleases)
		
		let request = createRequestObject({
			url: GOLDENMANGAS_DOMAIN,
			method: 'GET',
			headers: this.headers
		})
		let response = await this.requestManager.schedule(request, 1);

		let $ = this.cheerio.load(response.data || response['fixedData']);
		
		mostReadMangas.items = this.getHomePageMostReadMangas($);
		sectionCallback(mostReadMangas);
		
		latestUpdates.items = this.getHomePageLatestUpdates($);
		sectionCallback(latestUpdates);
		
		newReleases.items = this.getHomePageNewReleases($);
		sectionCallback(newReleases);
	}

	getHomePageMostReadMangas = ($): MangaTile[] =>  {
		let popularMangas: MangaTile[] = [];
		
		let context = $("div#maisLidos div.itemmanga");
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
			let id = $obj.attr('href')?.replace('/mangabr/','');
			let title = $obj.find("h3").text().trim();

			if (!id) {
				continue
			}

			popularMangas.push(createMangaTile({
				id: id,
				title: createIconText({ text: title }),
				image: img
			}))
		}
		
		return popularMangas;
	}
	
	getHomePageLatestUpdates = ($): MangaTile[] =>  {
		let popularMangas: MangaTile[] = [];
		
		let context = $("#response .atualizacao");
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
			let id = $obj.find('a').first().attr('href')?.replace('/mangabr/','');
			let title = $obj.find("h3").text().trim();

			if (!id) {
				continue
			}

			popularMangas.push(createMangaTile({
				id: id,
				title: createIconText({ text: title }),
				image: img
			}))
		}
		
		return popularMangas;
	}
	
	getHomePageNewReleases = ($): MangaTile[] =>  {
		let popularMangas: MangaTile[] = [];
		
		let context = $(".manga-novo .row");
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
			let id = $obj.find('a').first().attr('href')?.replace('/mangabr/','');
			let title = $obj.find("h2").text().trim();
			let synopsis = $obj.find("span").text().trim();
			if (!id) {
				continue
			}

			popularMangas.push(createMangaTile({
				id: id,
				primaryText: createIconText({ text: synopsis }),//Todo: Check the best place to put the synopsis
				title: createIconText({ text: title }),
				image: img
			}))
		}
		
		return popularMangas;
	}
	
	override async getTags(): Promise<TagSection[]> {
		const options = createRequestObject({
			url: `${GOLDENMANGAS_DOMAIN}/mangabr?genero`,
			method: 'GET'
		});
		let response = await this.requestManager.schedule(options, 1);
		let $ = this.cheerio.load(response.data || response['fixedData']);

		const genres: Tag[] = [];
		for (const obj of $(".container").eq(4).find("a.btn-warning").toArray()) {
			const $obj = $(obj);

			const id = $obj.attr("href").replace('/mangabr?genero=,','');
			genres.push(createTag({
				id: id,
				label: $(obj).text().trim()
			}));
		}

		return [createTagSection({
			id: "Genero",
			label: "Genero",
			tags: genres
		})];
	}

}