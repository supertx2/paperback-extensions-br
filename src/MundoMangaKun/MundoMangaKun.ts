import {
    Chapter,
    ChapterDetails,
    ContentRating,
    HomeSection,
    HomeSectionType,
    LanguageCode,
    Manga,
    PagedResults,
    SearchRequest,
    Source,
    SourceInfo,
    TagSection,
    TagType,
} from 'paperback-extensions-common'

import { Parser } from './MundoMangaKunParser'

const BASE_DOMAIN = 'https://mundomangakun.com.br'

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
            text: 'Portuguese',
            type: TagType.GREY,
        },
        {
            text: 'Cloudflare',
            type: TagType.RED,
        },
    ],
}

export class MundoMangaKun extends Source {
    private readonly parser: Parser = new Parser()

    requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request) => {
                request.headers = this.constructHeaders(request.url, request.headers)
                return request
            },
            interceptResponse: async (response) => response,
        },
    })


    async getMangaDetails(mangaId: string): Promise<Manga> {

        const request = createRequestObject({
            url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
            method: 'GET',
        })

        const data = await this.requestManager.schedule(request, 3)
        const $ = this.cheerio.load(data.data)

        return this.parser.parseMangaDetails($, mangaId)
    }


    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
            method: 'GET',
        })
        const data = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(data.data)

        return this.parser.parseChapters($, mangaId)
    }


    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

        const request = createRequestObject({
            url: `${BASE_DOMAIN}/leitor-online/projeto/${mangaId}/${chapterId}/#todas-as-paginas`,
            method: 'GET',
            cookies: [
                createCookie({ name: 'apagarLuzes', value: '0', domain: 'mundomangakun.com.br', path: '/' }),
                createCookie({
                    name: 'modoNavegacaoLeitor',
                    value: '#todas-as-paginas',
                    domain: 'mundomangakun.com.br',
                    path: '/',
                }),
            ],
        })

        const data = await this.requestManager.schedule(request, 1)

        return this.parser.parseChapterDetails(data, mangaId, chapterId)
    }

    async getSearchResults(query: SearchRequest, metadata: { page: number, totalPages: number }): Promise<PagedResults> {

        const page = metadata?.page ?? 1
        if (page == -1) {
            return createPagedResults({ results: [], metadata: { page: -1 } })
        }

        let search = query.title ? `leitor_titulo_projeto=${query.title}` : ''

        if (!search && query.includedTags?.length && query.includedTags[0]) {
            const genreId = this.parser.getGenres()[query.includedTags[0].id]
            if(genreId)
                search = `leitor_genero_projeto=${genreId}`
        }

        const pageUrl = page > 1 ? `page/${page}/` : ''
        const request = createRequestObject({
            url: `${BASE_DOMAIN}/leitor-online/${pageUrl}?${search}&leitor_ordem_projeto=ASC`,
            method: 'GET',
        })

        const data = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(data.data)

        return this.parser.parseSearchResults($)
    }


    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        // Let the app know what the homsections are without filling in the data
        const mostReadMangas = createHomeSection({ id: 'destaques', title: 'Destaques', type: HomeSectionType.singleRowLarge })
        sectionCallback(mostReadMangas)
        const newReleases = createHomeSection({ id: 'newReleases', title: 'Novos Lançamentos', type: HomeSectionType.singleRowNormal, view_more: true })
        sectionCallback(newReleases)

        const request = createRequestObject({
            url: BASE_DOMAIN,
            method: 'GET',
        })

        const data = await this.requestManager.schedule(request, 2)
        const $ = this.cheerio.load(data.data)

        const popularMangas = this.parser.parseHomePageSections($)

        mostReadMangas.items = popularMangas
        sectionCallback(mostReadMangas)

        newReleases.items = this.parser.parseHomePageNewReleases($)
        sectionCallback(newReleases)
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: { page: number, lastPage: boolean }): Promise<PagedResults> {
        const page: number = metadata?.page ?? 1
        const lastPage = metadata?.lastPage ?? false

        if (lastPage || page == -1 || homepageSectionId !== 'newReleases') {
            return createPagedResults({ results: [], metadata: { page: -1 } })
        }

        const request = createRequestObject({
            url: `${BASE_DOMAIN}/wp-admin/admin-ajax.php`,
            data: `action=solicita_mais_capitulos&qtd_posts=${page*40}&modo_leitura=%23todas-as-paginas`,
            method: 'POST',
        })

        const response = await this.requestManager.schedule(request, 1)

        if(!response.data) {
            return createPagedResults({
                results: [],
                metadata: {
                    page: -1,
                    lastPage: true
                }
            })
        }

        const $ = this.cheerio.load(response.data)

        const mangas = this.parser.parseHomePageNewReleases($)

        return createPagedResults({
            results: mangas,
            metadata: {
                page: page + 1,
                lastPage: lastPage
            }
        })
    }

    override async getTags(): Promise<TagSection[]> {
        return this.parser.getTags()
    }

    override getCloudflareBypassRequest() {
        return createRequestObject({
            url: BASE_DOMAIN,
            headers: this.constructHeaders(BASE_DOMAIN),
            method: 'GET',
        })
    }

    constructHeaders(url: string, headers?: { [key: string]: string }): { [key: string]: string } {
        headers = headers ?? {}
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36'

        if (url && url.includes('mundomangakun.com.br')) {
            headers['referer'] = BASE_DOMAIN
            headers['Host'] = 'mundomangakun.com.br'
            headers['Origin'] = BASE_DOMAIN
        }
        return headers
    }
}
