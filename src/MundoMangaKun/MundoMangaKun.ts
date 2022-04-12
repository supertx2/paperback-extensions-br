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
	Tag, ContentRating, TagType
} from "paperback-extensions-common"

const BASE_DOMAIN = 'https://mundomangakun.com.br'
const method = 'GET'
export const MundoMangaKunInfo: SourceInfo = {
	version: '0.1',
	name: 'Mundo Mangá-kun',
	description: 'Extension that pulls manga from mundomangakun.com.brp',
	author: 'SuperTx2',
	authorWebsite: 'https://github.com/supertx2',
	icon: "icon.png",
	contentRating: ContentRating.ADULT,
	websiteBaseURL: BASE_DOMAIN,
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

export class MundoMangaKun extends Source {
	requestManager = createRequestManager({
		requestsPerSecond: 3,
		requestTimeout: 100000
	});
	readonly cookies = [createCookie({ name: 'set', value: 'h=1', domain: BASE_DOMAIN })]
	cloudflareBypassRequest() {
		console.log("cloudflareBypassRequest")
		return createRequestObject({
			url: `${BASE_DOMAIN}`,
			method,
		})
	}
	// getMangaShareUrl(mangaId: string): string | null { return `${BASE_DOMAIN}/mangabr/${mangaId}` }

	async getMangaDetails(mangaId: string): Promise<Manga> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
			method: 'GET',
			// cookies: [createCookie({ name: 'apagarLuzes', value: '0', domain: 'mundomangakun.com.br', path:'/' }),
			// createCookie({ name: 'modoNavegacaoLeitor', value: '#todas-as-paginas', domain: 'mundomangakun.com.br', path:'/' }),
			// createCookie({ name: '_ga', value: 'GA1.3.1857711392.1649606782', domain: 'mundomangakun.com.br', path:'/' }),
			// createCookie({ name: '_gid', value: 'GA1.3.1857711392.1649606782', domain: 'mundomangakun.com.br', path:'/' })],
			headers: this.constructHeaders({
				// "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
				// "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7"
			})
		})
		console.log('getMangaDetails');

		const data = await this.requestManager.schedule(request, 3)
		console.log(`getMangaDetails Done. Status ${data.status}, data: ${typeof (data.data)}`)
		let manga: Manga[] = []
		let $ = this.cheerio.load(data.data)
		console.log("cheerio Loaded");
		const $infoElement = $(".main_container_projeto .container-fluid");
		const $infoText = $infoElement.find(".tabela_info_projeto tr");
		const titles = [$infoElement.find(".titulo_projeto").first().text().trim()];
		const image = $infoElement.find('.imagens_projeto_container img').attr('src');
		const status = $infoText.eq(5).find('td').eq(1).text() == "Em Andamento" ? MangaStatus.ONGOING : MangaStatus.COMPLETED;
		const author = $infoElement.find(".tabela_info_projeto tr").eq(1).find('td').eq(1).text();
		const artist = $infoElement.find(".tabela_info_projeto tr").eq(0).find('td').eq(1).text();
		console.log("Main Info Loaded");
		const genres: Tag[] = [];
		$infoElement.find(".generos a").filter((i, e) => !!$(e).text()).toArray().map(e => genres.push({
			id: $(e).attr('href')?.replace(`${mangaId}/generos/`, '').replace('/', '/')!
			, label: $(e).text().trim()
		}));
		console.log("Tags Loaded")
		let tags: TagSection[] = [createTagSection({ id: 'genres', label: 'genres', tags: genres })]

		let summary = $infoElement.find(".conteudo_projeto").text().trim()

		return createManga({
			id: mangaId,
			rating: 1,//unknown
			views: 1,
			titles: titles,
			image: `${image!}`,
			author: author,
			artist: artist,
			status: Number(status),
			// tags: tags,
			desc: summary
		})
	}


	async getChapters(mangaId: string): Promise<Chapter[]> {
		console.log('getChapters');

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
			method: "GET",
			headers: this.constructHeaders()
		})
		const data = await this.requestManager.schedule(request, 1)

		let $ = this.cheerio.load(data.data)
		let chapters: Chapter[] = []

		for (let obj of $(".capitulos_leitor_online a").toArray()) {
			const $obj = $(obj);

			const name = $obj.text();

			const clickEvent = $obj.attr("onclick");
			const id = clickEvent?.substring(clickEvent.indexOf(mangaId), clickEvent.indexOf(`','tipo'`)).replaceAll('\\', '').replace(`${mangaId}/`, '').split('/')[0];
			let chapNum = Number(name.replace(/\D/g, ''));

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
			}))
		}

		return chapters
	}


	async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
		console.log('getChapterDetails');

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/leitor-online/projeto/${mangaId}/${chapterId}/#todas-as-paginas`,
			method: 'GET',
			cookies: [
				createCookie({ name: 'apagarLuzes', value: '0', domain: 'mundomangakun.com.br', path:'/' }),
				createCookie({ name: 'modoNavegacaoLeitor', value: '#todas-as-paginas', domain: 'mundomangakun.com.br', path:'/' }),
				createCookie({ name: '_ga', value: 'GA1.3.1857711392.1649606782', domain: 'mundomangakun.com.br', path:'/' }),
				createCookie({ name: '_gid', value: 'GA1.3.1857711392.1649606782', domain: 'mundomangakun.com.br', path:'/' })
			],
			headers: this.constructHeaders()
		})

		const data = await this.requestManager.schedule(request, 1)

		// let $ = this.cheerio.load(data.data)
		// let pages: string[] = []

		let pagesString = data.data
		const pagesStartIndex = pagesString.indexOf("var paginas = ");
		pagesString = pagesString.substring(pagesStartIndex, pagesString.length -1)
		pagesString = pagesString.substring(0, pagesString.indexOf(']') + 1).replace('var paginas = ','');
		const pagesObject = JSON.parse(pagesString)
		// Get all of the pages
		// let pagesImgs = $(".leitor_online_container_capitulo img");
		
		// for (let img of pagesImgs.toArray()) {
		// 	const $img = $(img);
		// 	pages.push($img.attr("src")!)
		// }

		return createChapterDetails({
			id: chapterId,
			mangaId: mangaId,
			pages: pagesObject,
			longStrip: false
		})
	}

	async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/leitor-online/?leitor_titulo_projeto=${query.title}&leitor_autor_projeto=&leitor_genero_projeto=&leitor_status_projeto=&leitor_ordem_projeto=ASC`,
			method: "GET",
			headers: this.constructHeaders()
		})

		const data = await this.requestManager.schedule(request, 1)
		const $ = this.cheerio.load(data.data)

		let mangaTiles: MangaTile[] = []

		// Parse the json context
		for (let manga of $(".leitor_online_container article").toArray()) {
			const $manga = $(manga);

			const $titleA = $manga.find(".titulo_manga_item a");
			const title = $titleA.text();
			const id = $titleA.attr("href")?.replace(`${BASE_DOMAIN}/projeto/`, '').replace('/', '');
			const image = $manga.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, "");
			mangaTiles.push(createMangaTile({
				id: id!,
				title: createIconText({ text: title }),
				image: `${image!}`
			}))

		}

		// Because we're reading JSON, there will never be another page to search through
		return createPagedResults({
			results: mangaTiles
		})

	}


	async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

		// Let the app know what the homsections are without filling in the data
		let mostReadMangas = createHomeSection({ id: 'destaques', title: 'Destaques' })
		sectionCallback(mostReadMangas)


		// Make the request and fill out available titles
		let request = createRequestObject({
			url: BASE_DOMAIN,
			method: 'GET',
			// cookies: this.cookies,
			// cookies:  [createCookie({ name: 'PHPSESSID', value: 'vaioolegvh5c5l83p9kfeg059m', domain: 'goldenmanga.top', path:'/' })],
			headers: this.constructHeaders()
		})

		const data = await this.requestManager.schedule(request, 2)
		let popularMangas: MangaTile[] = []

		let $ = this.cheerio.load(data.data);

		let context = $(".lancamentos_main_container .container-obras-populares article");
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = $obj.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, "");
			const titleLink = $('a', $(obj)).attr('href')!;
			let id = titleLink.replace('https://mundomangakun.com.br/projeto/', '').replace('/', '');
			const title = id.replaceAll('-', ' ').toLowerCase().replace(/\b[a-z]/g, function (letter) {
				return letter.toUpperCase();
			});

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

	getCloudflareBypassRequest() {
		console.log('getCloudflareBypassRequest')
		return createRequestObject({
			url: 'https://mundomangakun.com.br/projeto/gleipnir/',
			method: "GET",
		})
	}

	userAgentRandomizer = `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/78.0${Math.floor(Math.random() * 100000)}`
	constructHeaders(headers?: any, refererPath?: string): any {
		headers = headers ?? {}
		if (this.userAgentRandomizer !== '') {
			headers['User-Agent'] = this.userAgentRandomizer
		}
		headers['referer'] = BASE_DOMAIN
		headers['Host'] = `mundomangakun.com.br`
		headers['Origin'] = BASE_DOMAIN
		return headers
	}
}