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

import {Parser} from "./MundoMangaKunParser";

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
	private readonly parser: Parser = new Parser();

	requestManager = createRequestManager({
		requestsPerSecond: 3,
		requestTimeout: 100000
	});
	readonly cookies = [createCookie({ name: 'set', value: 'h=1', domain: BASE_DOMAIN })]
	cloudflareBypassRequest() {
		return createRequestObject({
			url: `${BASE_DOMAIN}`,
			method,
		})
	}

	async getMangaDetails(mangaId: string): Promise<Manga> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
			method: 'GET',
		})

		const data = await this.requestManager.schedule(request, 3)

		let manga: Manga[] = []
		let $ = this.cheerio.load(data.data)
		return this.parser.parseMangaDetails($, mangaId);
	}


	async getChapters(mangaId: string): Promise<Chapter[]> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
			method: "GET",
			headers: this.constructHeaders()
		})
		const data = await this.requestManager.schedule(request, 1)

		let $ = this.cheerio.load(data.data)
		
		return this.parser.parseChapters($, mangaId);
	}


	async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

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

		return this.parser.parseChapterDetails(data, mangaId, chapterId);
	}

	async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/leitor-online/?leitor_titulo_projeto=${query.title}&leitor_autor_projeto=&leitor_genero_projeto=&leitor_status_projeto=&leitor_ordem_projeto=ASC`,
			method: "GET",
			headers: this.constructHeaders()
		})

		const data = await this.requestManager.schedule(request, 1)
		const $ = this.cheerio.load(data.data)

		return this.parser.parseSearchResults($, query, metadata);

	}


	async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
		// Let the app know what the homsections are without filling in the data
		let mostReadMangas = createHomeSection({ id: 'destaques', title: 'Destaques' })
		sectionCallback(mostReadMangas)


		let request = createRequestObject({
			url: BASE_DOMAIN,
			method: 'GET',
			headers: this.constructHeaders()
		})

		const data = await this.requestManager.schedule(request, 2)
		let $ = this.cheerio.load(data.data);

		const popularMangas = this.parser.parseHomePageSections($);

		mostReadMangas.items = popularMangas
		sectionCallback(mostReadMangas)
	}

	getCloudflareBypassRequest() {
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