import {
	Source,
	Manga,
	Chapter,
	ChapterDetails,
	HomeSection,
	SearchRequest,
	LanguageCode,
	PagedResults,
	SourceInfo,
	ContentRating,
	TagType,
} from 'paperback-extensions-common';

import {Parser} from './MundoMangaKunParser';

const BASE_DOMAIN = 'https://mundomangakun.com.br';
const method = 'GET';
export const MundoMangaKunInfo: SourceInfo = {
	version: '0.1',
	name: 'Mundo Mangá-kun',
	description: 'Extension that pulls manga from mundomangakun.com.brp',
	author: 'SuperTx2',
	authorWebsite: 'https://github.com/supertx2',
	icon: 'icon.png',
	contentRating: ContentRating.ADULT,
	websiteBaseURL: BASE_DOMAIN,
	language: LanguageCode.PORTUGUESE,
	sourceTags: [
		{
			text: LanguageCode.PORTUGUESE,
			type: TagType.GREY,
		},
	],
};

export class MundoMangaKun extends Source {
	private readonly parser: Parser = new Parser();

	requestManager = createRequestManager({
		requestsPerSecond: 3,
		requestTimeout: 100000,
		interceptor: {
			interceptRequest: async (request) => {
				request.headers = this.constructHeaders(request.url);
				return request;
			},
			interceptResponse: async (response) => response,
		},
	});

	cloudflareBypassRequest() {
		return createRequestObject({
			url: `${BASE_DOMAIN}`,
			method,
		});
	}

	async getMangaDetails(mangaId: string): Promise<Manga> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
			method: 'GET',
		});

		const data = await this.requestManager.schedule(request, 3);
		let $ = this.cheerio.load(data.data);

		return this.parser.parseMangaDetails($, mangaId);
	}


	async getChapters(mangaId: string): Promise<Chapter[]> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
			method: 'GET',
		});
		const data = await this.requestManager.schedule(request, 1);
		let $ = this.cheerio.load(data.data);

		return this.parser.parseChapters($, mangaId);
	}


	async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/leitor-online/projeto/${mangaId}/${chapterId}/#todas-as-paginas`,
			method: 'GET',
			cookies: [
				createCookie({name: 'apagarLuzes', value: '0', domain: 'mundomangakun.com.br', path: '/'}),
				createCookie({
					name: 'modoNavegacaoLeitor',
					value: '#todas-as-paginas',
					domain: 'mundomangakun.com.br',
					path: '/',
				}),
			],
		});

		const data = await this.requestManager.schedule(request, 1);

		return this.parser.parseChapterDetails(data, mangaId, chapterId);
	}

	async getSearchResults(query: SearchRequest, _metadata: any): Promise<PagedResults> {

		let request = createRequestObject({
			url: `${BASE_DOMAIN}/leitor-online/?leitor_titulo_projeto=${query.title}&leitor_autor_projeto=&leitor_genero_projeto=&leitor_status_projeto=&leitor_ordem_projeto=ASC`,
			method: 'GET',
		});

		const data = await this.requestManager.schedule(request, 1);
		const $ = this.cheerio.load(data.data);

		return this.parser.parseSearchResults($);
	}


	override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
		// Let the app know what the homsections are without filling in the data
		let mostReadMangas = createHomeSection({id: 'destaques', title: 'Destaques'});
		sectionCallback(mostReadMangas);

		let request = createRequestObject({
			url: BASE_DOMAIN,
			method: 'GET',
		});

		const data = await this.requestManager.schedule(request, 2);
		let $ = this.cheerio.load(data.data);

		const popularMangas = this.parser.parseHomePageSections($);

		mostReadMangas.items = popularMangas;
		sectionCallback(mostReadMangas);
	}

	override getCloudflareBypassRequest() {
		return createRequestObject({
			url: 'https://mundomangakun.com.br/projeto/gleipnir/',
			method: 'GET',
		});
	}

	constructHeaders(url: string, headers?: any): any {
		headers = headers ?? {};
		headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36';

		if (url && url.includes('mundomangakun.com.br')) {
			headers['referer'] = BASE_DOMAIN;
			headers['Host'] = `mundomangakun.com.br`;
			headers['Origin'] = BASE_DOMAIN;
		}
		return headers;
	}
}
